/**
 * SM2 椭圆曲线参数和工具函数
 *
 * 标准参考：
 * - GM/T 0003-2012: SM2 椭圆曲线公钥密码算法
 * - GM/T 0009-2023: SM2 密码算法使用规范
 *
 * 使用 @noble/curves 进行高效的椭圆曲线运算
 */

import { weierstrass, ecdsa } from '@noble/curves/abstract/weierstrass.js';
import { Field } from '@noble/curves/abstract/modular.js';
import { sha256 } from '@noble/hashes/sha2.js';

/**
 * SM2 推荐曲线参数
 *
 * 标准参考：
 * - GM/T 0003-2012: SM2 椭圆曲线公钥密码算法
 * - GM/T 0009-2023: SM2 密码算法使用规范（继续使用相同的曲线参数）
 *
 * 素数域 p = 2^256 - 2^224 - 2^96 + 2^64 - 1
 */
export const SM2_CURVE_PARAMS = {
  // 素数模数 p
  p: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFF',
  // 系数 a
  a: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFC',
  // 系数 b
  b: '28E9FA9E9D9F5E344D5A9E4BCF6509A7F39789F515AB8F92DDBCBD414D940E93',
  // 基点 x 坐标
  Gx: '32C4AE2C1F1981195F9904466A39C9948FE30BBFF2660BE1715A4589334C74C7',
  // 基点 y 坐标
  Gy: 'BC3736A2F4F6779C59BDCEE36B692153D0A9877CC62A474002DF32E52139F0A0',
  // 阶 n
  n: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFF7203DF6B21C6052B53BBF40939D54123',
  // 余因子
  h: 1,
} as const;

/**
 * 从十六进制字符串创建 bigint
 */
export function hexToBigInt(hex: string): bigint {
  if (hex.startsWith('0x')) {
    return BigInt(hex);
  }
  return BigInt('0x' + hex);
}

/**
 * 将 bigint 转换为十六进制字符串（固定长度）
 */
export function bigIntToHex(value: bigint, length: number = 64): string {
  return value.toString(16).padStart(length, '0');
}

/**
 * 生成随机字节的跨平台函数
 * 优雅地处理 Node.js 和浏览器环境，提供三重回退机制
 *
 * 优先级（从高到低）:
 * 1. Web Crypto API (crypto.getRandomValues) - 密码学安全的随机数生成器
 *    - 浏览器环境：window.crypto.getRandomValues
 *    - Node.js 15+：globalThis.crypto.getRandomValues
 *    - 这是最安全的方式，使用操作系统提供的 CSPRNG
 *
 * 2. Node.js Crypto Module (crypto.randomBytes) - 密码学安全的随机数生成器
 *    - Node.js < 15：使用 require('crypto').randomBytes
 *    - 同样使用操作系统提供的 CSPRNG
 *    - 为旧版本 Node.js 提供安全的随机数
 *
 * 3. 时间戳 + Math.random() - 应急回退方案
 *    - ⚠️ 警告：这不是密码学安全的！
 *    - 仅用于开发/测试环境
 *    - 不应在生产环境中使用
 *    - 会在控制台输出警告信息
 *
 * 设计理念：
 * - 优先使用最安全的随机数源
 * - 在不可用时自动降级到次优方案
 * - 确保在各种环境（浏览器、Node.js、小程序）中都能正常工作
 * - 通过警告信息提醒开发者当前使用的随机数源质量
 *
 * 在 Node.js 环境中，通过 test/setup.ts 中的 polyfill 提供 crypto.getRandomValues
 * 在浏览器环境中，直接使用 Web Crypto API
 * 在微信小程序等环境中，可能需要自行实现回退方案
 */
function getRandomBytes(bytesLength: number = 32): Uint8Array {
  // 第一优先级: Web Crypto API (浏览器和现代 Node.js)
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(new Uint8Array(bytesLength));
  }

  // 第二优先级: Node.js Crypto Module (旧版本 Node.js)
  // 尝试动态导入 Node.js 的 crypto 模块
  try {
    // 使用动态 require 来避免在浏览器环境中出错
    // 使用类型断言避免 TypeScript 错误，同时保持运行时兼容性
    const nodeRequire = typeof require !== 'undefined' ? require : null;
    const nodeCrypto = nodeRequire ? nodeRequire('crypto') : null;
    if (nodeCrypto && typeof nodeCrypto.randomBytes === 'function') {
      const buffer = nodeCrypto.randomBytes(bytesLength);
      return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    }
  } catch (e) {
    // 在浏览器或不支持 crypto 的环境中会失败，继续尝试下一个方案
  }

  // 第三优先级: 使用时间戳 + Math.random() 作为回退方案
  // 警告：此方案的随机性较弱，仅用于开发/测试环境
  console.warn('Warning: Using Math.random() for random number generation. This is NOT cryptographically secure and should only be used for testing purposes.');

  const bytes = new Uint8Array(bytesLength);
  const timestamp = Date.now();

  for (let i = 0; i < bytesLength; i++) {
    // 结合时间戳和 Math.random() 生成伪随机数
    const random = Math.random() * 256;
    const timestampByte = (timestamp >> (i % 8)) & 0xff;
    bytes[i] = (random ^ timestampByte) & 0xff;
  }

  return bytes;
}

// SM2 曲线参数（BigInt格式）
const sm2CurveConfig = {
  p: hexToBigInt(SM2_CURVE_PARAMS.p),
  a: hexToBigInt(SM2_CURVE_PARAMS.a),
  b: hexToBigInt(SM2_CURVE_PARAMS.b),
  Gx: hexToBigInt(SM2_CURVE_PARAMS.Gx),
  Gy: hexToBigInt(SM2_CURVE_PARAMS.Gy),
  n: hexToBigInt(SM2_CURVE_PARAMS.n),
  h: BigInt(SM2_CURVE_PARAMS.h),
};

// 创建有限域
const Fp = Field(sm2CurveConfig.p);

// 创建椭圆曲线点
const sm2Point = weierstrass(sm2CurveConfig, {
  Fp,
});

/**
 * SM2 椭圆曲线实例（带签名/验签功能）
 * 使用 @noble/curves 的 ecdsa 包装器
 */
export const sm2 = ecdsa(sm2Point, sha256, {
  randomBytes: getRandomBytes,
});
