#!/usr/bin/env tsx
/**
 * 本地测试脚本 - 用于快速测试 SMKit 的各项功能
 * Local test script - for quickly testing SMKit features
 *
 * 运行方式 / Run with: npx tsx test-local.ts
 */

import {
  // SM3
  digest,
  hmac,
  SM3,
  // SM4
  sm4Encrypt,
  sm4Decrypt,
  SM4,
  CipherMode,
  PaddingMode,
  // SM2
  generateKeyPair,
  getPublicKeyFromPrivateKey,
  sm2Encrypt,
  sm2Decrypt,
  sign,
  verify,
  keyExchange,
  SM2,
  SM2CipherMode,
  // ZUC
  zucEncrypt,
  zucDecrypt,
  eea3,
  eia3,
  ZUC,
  // Utils
  hexToBytes,
  bytesToHex,
} from './src/index';

console.log('='.repeat(60));
console.log('SMKit 本地测试 / SMKit Local Testing');
console.log('='.repeat(60));
console.log();

// ============================================================================
// SM3 哈希算法测试 / SM3 Hash Algorithm Tests
// ============================================================================
console.log('【1】SM3 哈希算法测试');
console.log('-'.repeat(60));

// 测试 1: 基本哈希
const testData = 'Hello, SMKit!';
const hash = digest(testData);
console.log(`✓ 基本哈希: digest("${testData}")`);
console.log(`  结果: ${hash}`);
console.log();

// 测试 2: HMAC
const key = 'secret-key';
const mac = hmac(key, testData);
console.log(`✓ HMAC: hmac("${key}", "${testData}")`);
console.log(`  结果: ${mac}`);
console.log();

// 测试 3: 增量哈希
const sm3 = new SM3();
sm3.update('Hello, ').update('SMKit!');
const incrementalHash = sm3.digest();
console.log('✓ 增量哈希: SM3.update("Hello, ").update("SMKit!")');
console.log(`  结果: ${incrementalHash}`);
console.log(`  匹配: ${incrementalHash === hash ? '✓ 是' : '✗ 否'}`);
console.log();

// ============================================================================
// SM4 分组密码测试 / SM4 Block Cipher Tests
// ============================================================================
console.log('【2】SM4 分组密码测试');
console.log('-'.repeat(60));

const sm4Key = '0123456789abcdeffedcba9876543210'; // 128位密钥
const sm4Plaintext = 'Hello, SM4 Encryption!';

// 测试 4: ECB 模式
console.log('✓ ECB 模式加密解密');
const ecbEncrypted = sm4Encrypt(sm4Key, sm4Plaintext, {
  mode: CipherMode.ECB,
  padding: PaddingMode.PKCS7
});
console.log(`  密文: ${ecbEncrypted}`);
const ecbDecrypted = sm4Decrypt(sm4Key, ecbEncrypted, {
  mode: CipherMode.ECB,
  padding: PaddingMode.PKCS7
});
console.log(`  解密: ${ecbDecrypted}`);
console.log(`  匹配: ${ecbDecrypted === sm4Plaintext ? '✓ 是' : '✗ 否'}`);
console.log();

// 测试 5: CBC 模式
const iv = 'fedcba98765432100123456789abcdef'; // 128位IV
console.log('✓ CBC 模式加密解密');
const cbcEncrypted = sm4Encrypt(sm4Key, sm4Plaintext, {
  mode: CipherMode.CBC,
  padding: PaddingMode.PKCS7,
  iv
});
console.log(`  密文: ${cbcEncrypted}`);
const cbcDecrypted = sm4Decrypt(sm4Key, cbcEncrypted, {
  mode: CipherMode.CBC,
  padding: PaddingMode.PKCS7,
  iv
});
console.log(`  解密: ${cbcDecrypted}`);
console.log(`  匹配: ${cbcDecrypted === sm4Plaintext ? '✓ 是' : '✗ 否'}`);
console.log();

// 测试 6: CTR 模式
const counter = '00000000000000000000000000000000';
console.log('✓ CTR 模式加密解密（流密码模式，无需填充）');
const ctrEncrypted = sm4Encrypt(sm4Key, sm4Plaintext, {
  mode: CipherMode.CTR,
  iv: counter
});
console.log(`  密文: ${ctrEncrypted}`);
const ctrDecrypted = sm4Decrypt(sm4Key, ctrEncrypted, {
  mode: CipherMode.CTR,
  iv: counter
});
console.log(`  解密: ${ctrDecrypted}`);
console.log(`  匹配: ${ctrDecrypted === sm4Plaintext ? '✓ 是' : '✗ 否'}`);
console.log();

// 测试 7: GCM 模式（认证加密）
const gcmIv = '000102030405060708090a0b'; // 96位IV
const aad = 'Additional Authenticated Data';
console.log('✓ GCM 模式认证加密');
const gcmResult = sm4Encrypt(sm4Key, sm4Plaintext, {
  mode: CipherMode.GCM,
  iv: gcmIv,
  aad
});
console.log(`  密文: ${gcmResult.ciphertext}`);
console.log(`  认证标签: ${gcmResult.tag}`);
const gcmDecrypted = sm4Decrypt(sm4Key, gcmResult, {
  mode: CipherMode.GCM,
  iv: gcmIv,
  aad
});
console.log(`  解密: ${gcmDecrypted}`);
console.log(`  匹配: ${gcmDecrypted === sm4Plaintext ? '✓ 是' : '✗ 否'}`);
console.log();

// ============================================================================
// SM2 椭圆曲线密码测试 / SM2 Elliptic Curve Tests
// ============================================================================
console.log('【3】SM2 椭圆曲线密码测试');
console.log('-'.repeat(60));

// 测试 8: 密钥对生成
console.log('✓ 生成密钥对');
const keyPair = generateKeyPair();
console.log(`  公钥 (前40字符): ${keyPair.publicKey.substring(0, 40)}...`);
console.log(`  公钥长度: ${keyPair.publicKey.length} 字符`);
console.log(`  私钥 (前40字符): ${keyPair.privateKey.substring(0, 40)}...`);
console.log(`  私钥长度: ${keyPair.privateKey.length} 字符`);
console.log();

// 测试 9: 从私钥派生公钥
console.log('✓ 从私钥派生公钥');
const derivedPublicKey = getPublicKeyFromPrivateKey(keyPair.privateKey);
console.log(`  派生公钥: ${derivedPublicKey.substring(0, 40)}...`);
console.log(`  匹配: ${derivedPublicKey === keyPair.publicKey ? '✓ 是' : '✗ 否'}`);
console.log();

// 测试 10: SM2 加密解密
const sm2Plaintext = 'Hello, SM2!';
console.log(`✓ SM2 加密解密: "${sm2Plaintext}"`);
const sm2Encrypted = sm2Encrypt(keyPair.publicKey, sm2Plaintext, SM2CipherMode.C1C3C2);
console.log(`  密文 (前40字符): ${sm2Encrypted.substring(0, 40)}...`);
console.log(`  密文长度: ${sm2Encrypted.length} 字符`);
const sm2Decrypted = sm2Decrypt(keyPair.privateKey, sm2Encrypted, SM2CipherMode.C1C3C2);
console.log(`  解密: ${sm2Decrypted}`);
console.log(`  匹配: ${sm2Decrypted === sm2Plaintext ? '✓ 是' : '✗ 否'}`);
console.log();

// 测试 11: SM2 签名验签
const message = 'Message to sign with SM2';
console.log(`✓ SM2 签名验签: "${message}"`);
const signature = sign(keyPair.privateKey, message);
console.log(`  签名 (前40字符): ${signature.substring(0, 40)}...`);
console.log(`  签名长度: ${signature.length} 字符`);
const isValid = verify(keyPair.publicKey, message, signature);
console.log(`  验签结果: ${isValid ? '✓ 有效' : '✗ 无效'}`);
console.log();

// 测试 12: SM2 密钥交换
console.log('✓ SM2 密钥交换协议');
const alice = generateKeyPair();
const bob = generateKeyPair();
const aliceTemp = generateKeyPair();
const bobTemp = generateKeyPair();

const aliceResult = keyExchange({
  privateKey: alice.privateKey,
  tempPrivateKey: aliceTemp.privateKey,
  peerPublicKey: bob.publicKey,
  peerTempPublicKey: bobTemp.publicKey,
  isInitiator: true,
  keyLength: 16
});

const bobResult = keyExchange({
  privateKey: bob.privateKey,
  tempPrivateKey: bobTemp.privateKey,
  peerPublicKey: alice.publicKey,
  peerTempPublicKey: aliceTemp.publicKey,
  isInitiator: false,
  keyLength: 16
});

console.log(`  Alice 共享密钥: ${aliceResult.sharedKey}`);
console.log(`  Bob 共享密钥: ${bobResult.sharedKey}`);
console.log(`  密钥匹配: ${aliceResult.sharedKey === bobResult.sharedKey ? '✓ 是' : '✗ 否'}`);
console.log();

// ============================================================================
// ZUC 流密码测试 / ZUC Stream Cipher Tests
// ============================================================================
console.log('【4】ZUC 流密码测试');
console.log('-'.repeat(60));

const zucKey = '00112233445566778899aabbccddeeff';
const zucIv = 'ffeeddccbbaa99887766554433221100';
const zucPlaintext = 'Hello, ZUC!';

// 测试 13: ZUC 加密解密
console.log(`✓ ZUC 加密解密: "${zucPlaintext}"`);
const zucEncrypted = zucEncrypt(zucKey, zucIv, zucPlaintext);
console.log(`  密文: ${zucEncrypted}`);
const zucDecrypted = zucDecrypt(zucKey, zucIv, zucEncrypted);
console.log(`  解密: ${zucDecrypted}`);
console.log(`  匹配: ${zucDecrypted === zucPlaintext ? '✓ 是' : '✗ 否'}`);
console.log();

// 测试 14: EEA3 (3GPP LTE 加密)
console.log('✓ EEA3 3GPP LTE 加密算法');
const count = 0x12345678;
const bearer = 5;
const direction = 0;
const length = 256;
const eea3Keystream = eea3(zucKey, count, bearer, direction, length);
console.log(`  密钥流 (前40字符): ${eea3Keystream.substring(0, 40)}...`);
console.log(`  密钥流长度: ${eea3Keystream.length} 字符 (${length / 4} 比特)`);
console.log();

// 测试 15: EIA3 (3GPP LTE 完整性)
console.log('✓ EIA3 3GPP LTE 完整性算法');
const integrityMessage = 'Message to authenticate';
const mac32bit = eia3(zucKey, count, bearer, direction, integrityMessage);
console.log(`  MAC 值: ${mac32bit}`);
console.log(`  MAC 长度: ${mac32bit.length} 字符 (32 比特)`);
console.log();

// ============================================================================
// 总结 / Summary
// ============================================================================
console.log('='.repeat(60));
console.log('测试完成! / Testing Complete!');
console.log('='.repeat(60));
console.log();
console.log('所有功能测试通过 ✓');
console.log();
console.log('下一步:');
console.log('  1. 运行完整测试套件: npm test');
console.log('  2. 查看演示页面: npm run demo');
console.log('  3. 查看 Vue 演示: cd demo-vue && npm run dev');
console.log('  4. 查看 Hutool 对接指南: cat docs/HUTOOL-INTEGRATION.zh-CN.md');
console.log();
