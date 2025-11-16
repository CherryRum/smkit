/**
 * SHA 哈希算法的面向对象 API
 */

import { sha256 as nobleSha256, sha384 as nobleSha384, sha512 as nobleSha512 } from '@noble/hashes/sha2.js';
import { sha1 as nobleSha1 } from '@noble/hashes/legacy.js';
import { normalizeInput, bytesToHex, bytesToBase64 } from '../../core/utils';
import { OutputFormat, type OutputFormatType } from '../../types/constants';

/**
 * SHA 哈希类基类
 */
abstract class SHABase {
  protected hasher: any;
  protected outputFormat: OutputFormatType;

  constructor(hasher: any, outputFormat: OutputFormatType = OutputFormat.HEX) {
    this.hasher = hasher.create();
    this.outputFormat = outputFormat;
  }

  /**
   * 更新哈希状态（增量哈希）
   * @param data - 要添加的数据
   * @returns 当前实例（支持链式调用）
   */
  update(data: string | Uint8Array): this {
    const bytes = normalizeInput(data);
    this.hasher.update(bytes);
    return this;
  }

  /**
   * 完成哈希计算并返回结果
   * @returns 哈希摘要
   */
  digest(): string {
    const hash = this.hasher.digest();
    return this.outputFormat === OutputFormat.BASE64 ? bytesToBase64(hash) : bytesToHex(hash);
  }

  /**
   * 重置哈希状态
   * @returns 当前实例（支持链式调用）
   */
  reset(): this {
    // 创建新的哈希器实例
    this.hasher = this.getHasherConstructor().create();
    return this;
  }

  /**
   * 设置输出格式
   * @param format - 输出格式
   */
  setOutputFormat(format: OutputFormatType): void {
    this.outputFormat = format;
  }

  /**
   * 获取输出格式
   * @returns 当前输出格式
   */
  getOutputFormat(): OutputFormatType {
    return this.outputFormat;
  }

  /**
   * 获取哈希器构造函数（子类实现）
   */
  protected abstract getHasherConstructor(): any;
}

/**
 * SHA-256 哈希类
 *
 * @example
 * ```typescript
 * // 静态方法
 * const hash = SHA256.digest('Hello, World!');
 *
 * // 增量哈希
 * const sha = new SHA256();
 * sha.update('Hello, ').update('World!');
 * const result = sha.digest();
 * ```
 */
export class SHA256 extends SHABase {
  constructor(outputFormat?: OutputFormatType) {
    super(nobleSha256, outputFormat);
  }

  protected getHasherConstructor() {
    return nobleSha256;
  }

  /**
   * 静态方法：计算 SHA-256 哈希
   * @param data - 输入数据
   * @param outputFormat - 输出格式（默认 hex）
   * @returns 哈希摘要
   */
  static digest(data: string | Uint8Array, outputFormat: OutputFormatType = OutputFormat.HEX): string {
    const bytes = normalizeInput(data);
    const hash = nobleSha256(bytes);
    return outputFormat === OutputFormat.BASE64 ? bytesToBase64(hash) : bytesToHex(hash);
  }
}

/**
 * SHA-384 哈希类
 */
export class SHA384 extends SHABase {
  constructor(outputFormat?: OutputFormatType) {
    super(nobleSha384, outputFormat);
  }

  protected getHasherConstructor() {
    return nobleSha384;
  }

  /**
   * 静态方法：计算 SHA-384 哈希
   * @param data - 输入数据
   * @param outputFormat - 输出格式（默认 hex）
   * @returns 哈希摘要
   */
  static digest(data: string | Uint8Array, outputFormat: OutputFormatType = OutputFormat.HEX): string {
    const bytes = normalizeInput(data);
    const hash = nobleSha384(bytes);
    return outputFormat === OutputFormat.BASE64 ? bytesToBase64(hash) : bytesToHex(hash);
  }
}

/**
 * SHA-512 哈希类
 */
export class SHA512 extends SHABase {
  constructor(outputFormat?: OutputFormatType) {
    super(nobleSha512, outputFormat);
  }

  protected getHasherConstructor() {
    return nobleSha512;
  }

  /**
   * 静态方法：计算 SHA-512 哈希
   * @param data - 输入数据
   * @param outputFormat - 输出格式（默认 hex）
   * @returns 哈希摘要
   */
  static digest(data: string | Uint8Array, outputFormat: OutputFormatType = OutputFormat.HEX): string {
    const bytes = normalizeInput(data);
    const hash = nobleSha512(bytes);
    return outputFormat === OutputFormat.BASE64 ? bytesToBase64(hash) : bytesToHex(hash);
  }
}

/**
 * SHA-1 哈希类
 * 注意：SHA-1 已被证明存在安全漏洞，不推荐用于安全敏感场景
 */
export class SHA1 extends SHABase {
  constructor(outputFormat?: OutputFormatType) {
    super(nobleSha1, outputFormat);
  }

  protected getHasherConstructor() {
    return nobleSha1;
  }

  /**
   * 静态方法：计算 SHA-1 哈希
   * @param data - 输入数据
   * @param outputFormat - 输出格式（默认 hex）
   * @returns 哈希摘要
   */
  static digest(data: string | Uint8Array, outputFormat: OutputFormatType = OutputFormat.HEX): string {
    const bytes = normalizeInput(data);
    const hash = nobleSha1(bytes);
    return outputFormat === OutputFormat.BASE64 ? bytesToBase64(hash) : bytesToHex(hash);
  }
}
