/**
 * ASN.1 DER encoding/decoding utilities for SM2
 * Based on ITU-T X.690 standard
 *
 * ASN.1 (Abstract Syntax Notation One) 是一种用于描述数据结构的标准。
 * DER (Distinguished Encoding Rules) 是 ASN.1 的一种编码规则，确保相同数据只有唯一的编码形式。
 *
 * 本模块提供以下功能：
 * 1. 基本 ASN.1 类型的编码/解码（INTEGER, SEQUENCE 等）
 * 2. SM2 签名的 DER 编码/解码
 * 3. Raw 格式（r || s）与 DER 格式的相互转换
 * 4. ASN.1 结构到 XML 的转换（用于调试和可视化）
 *
 * 性能优化：
 * - 使用 slice() 代替已废弃的 substr()，符合现代 JavaScript 标准
 * - 直接操作 Uint8Array，减少内存分配和复制
 * - 使用位运算进行长度编码/解码，提高效率
 *
 * 参考标准：
 * - ITU-T X.690: ASN.1 编码规则
 * - GM/T 0009-2012: SM2 密码算法使用规范
 */

/**
 * ASN.1 tag types
 */
export const ASN1Tag = {
  INTEGER: 0x02,
  BIT_STRING: 0x03,
  OCTET_STRING: 0x04,
  NULL: 0x05,
  OBJECT_IDENTIFIER: 0x06,
  SEQUENCE: 0x30,
} as const;

/**
 * Encode length in DER format
 * @param length - Length to encode
 * @returns DER-encoded length bytes
 */
function encodeLength(length: number): Uint8Array {
  if (length < 128) {
    return new Uint8Array([length]);
  }

  const bytes: number[] = [];
  let temp = length;
  while (temp > 0) {
    bytes.unshift(temp & 0xff);
    temp >>= 8;
  }

  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

/**
 * Decode length from DER format
 * @param data - Data containing DER-encoded length
 * @param offset - Starting offset
 * @returns Object with length and bytes consumed
 */
function decodeLength(data: Uint8Array, offset: number): { length: number; bytesRead: number } {
  const firstByte = data[offset];

  if (firstByte < 128) {
    return { length: firstByte, bytesRead: 1 };
  }

  const numBytes = firstByte & 0x7f;
  let length = 0;

  for (let i = 0; i < numBytes; i++) {
    length = (length << 8) | data[offset + 1 + i];
  }

  return { length, bytesRead: 1 + numBytes };
}

/**
 * Encode integer in DER format
 * @param value - Integer value as hex string or Uint8Array
 * @returns DER-encoded integer
 */
export function encodeInteger(value: string | Uint8Array): Uint8Array {
  let bytes: Uint8Array;

  if (typeof value === 'string') {
    // Remove leading zeros but keep at least one byte
    // 优化：使用字符码判断避免正则表达式
    let startIdx = 0;
    while (startIdx < value.length - 1 && value.charCodeAt(startIdx) === 48) { // '0' = 48
      startIdx++;
    }
    const cleaned = value.slice(startIdx);
    const hex = cleaned.length % 2 === 0 ? cleaned : '0' + cleaned;
    bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
  } else {
    bytes = value;
  }

  // Add leading zero if high bit is set (to indicate positive number)
  if (bytes[0] & 0x80) {
    const padded = new Uint8Array(bytes.length + 1);
    padded[0] = 0x00;
    padded.set(bytes, 1);
    bytes = padded;
  }

  const length = encodeLength(bytes.length);
  const result = new Uint8Array(1 + length.length + bytes.length);
  result[0] = ASN1Tag.INTEGER;
  result.set(length, 1);
  result.set(bytes, 1 + length.length);

  return result;
}

/**
 * Decode integer from DER format
 * @param data - DER-encoded data
 * @param offset - Starting offset
 * @returns Object with integer value and bytes consumed
 */
export function decodeInteger(data: Uint8Array, offset: number = 0): { value: Uint8Array; bytesRead: number } {
  if (data[offset] !== ASN1Tag.INTEGER) {
    throw new Error('Expected INTEGER tag');
  }

  const { length, bytesRead: lengthBytes } = decodeLength(data, offset + 1);
  const start = offset + 1 + lengthBytes;
  const value = data.slice(start, start + length);

  // Remove leading zero if present (padding for positive numbers)
  const actualValue = value[0] === 0x00 ? value.slice(1) : value;

  return {
    value: actualValue,
    bytesRead: 1 + lengthBytes + length,
  };
}

/**
 * Encode sequence in DER format
 * @param elements - Array of DER-encoded elements
 * @returns DER-encoded sequence
 */
export function encodeSequence(...elements: Uint8Array[]): Uint8Array {
  const contentLength = elements.reduce((sum, el) => sum + el.length, 0);
  const length = encodeLength(contentLength);
  const result = new Uint8Array(1 + length.length + contentLength);

  result[0] = ASN1Tag.SEQUENCE;
  result.set(length, 1);

  let offset = 1 + length.length;
  for (const element of elements) {
    result.set(element, offset);
    offset += element.length;
  }

  return result;
}

/**
 * Decode sequence from DER format
 * @param data - DER-encoded data
 * @param offset - Starting offset
 * @returns Object with sequence elements and bytes consumed
 */
export function decodeSequence(data: Uint8Array, offset: number = 0): { elements: Uint8Array[]; bytesRead: number } {
  if (data[offset] !== ASN1Tag.SEQUENCE) {
    throw new Error('Expected SEQUENCE tag');
  }

  const { length, bytesRead: lengthBytes } = decodeLength(data, offset + 1);
  const contentStart = offset + 1 + lengthBytes;
  const contentEnd = contentStart + length;

  const elements: Uint8Array[] = [];
  let pos = contentStart;

  while (pos < contentEnd) {
    const { length: elemLength, bytesRead: elemLengthBytes } = decodeLength(data, pos + 1);
    const elemTotalLength = 1 + elemLengthBytes + elemLength;

    elements.push(data.slice(pos, pos + elemTotalLength));
    pos += elemTotalLength;
  }

  return {
    elements,
    bytesRead: 1 + lengthBytes + length,
  };
}

/**
 * Encode SM2 signature (r, s) in DER format
 * @param r - R component as hex string
 * @param s - S component as hex string
 * @returns DER-encoded signature
 */
export function encodeSignature(r: string, s: string): Uint8Array {
  const rEncoded = encodeInteger(r);
  const sEncoded = encodeInteger(s);
  return encodeSequence(rEncoded, sEncoded);
}

/**
 * Decode SM2 signature from DER format
 * @param signature - DER-encoded signature
 * @returns Object with r and s components as hex strings
 */
export function decodeSignature(signature: Uint8Array): { r: string; s: string } {
  const { elements } = decodeSequence(signature);

  if (elements.length !== 2) {
    throw new Error('Invalid signature: expected 2 elements');
  }

  const { value: rBytes } = decodeInteger(elements[0]);
  const { value: sBytes } = decodeInteger(elements[1]);

  const r = Array.from(rBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const s = Array.from(sBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  return { r, s };
}

/**
 * Convert raw signature (r || s) to DER format
 * @param rawSignature - Raw signature as hex string (64 bytes)
 * @returns DER-encoded signature
 */
export function rawToDer(rawSignature: string): Uint8Array {
  if (rawSignature.length !== 128) {
    throw new Error('Raw signature must be 64 bytes (128 hex characters)');
  }

  const r = rawSignature.slice(0, 64);
  const s = rawSignature.slice(64, 128);

  return encodeSignature(r, s);
}

/**
 * Convert DER signature to raw format (r || s)
 * @param derSignature - DER-encoded signature
 * @returns Raw signature as hex string (64 bytes)
 */
export function derToRaw(derSignature: Uint8Array): string {
  const { r, s } = decodeSignature(derSignature);

  // Pad to 32 bytes each
  const rPadded = r.padStart(64, '0');
  const sPadded = s.padStart(64, '0');

  return rPadded + sPadded;
}

/**
 * Convert ASN.1 DER-encoded data to XML representation
 * @param data - DER-encoded data
 * @param indent - Indentation level (for pretty printing)
 * @returns XML string representation of the ASN.1 structure
 */
export function asn1ToXml(data: Uint8Array, indent: number = 0): string {
  const spaces = '  '.repeat(indent);
  let offset = 0;
  let xml = '';

  while (offset < data.length) {
    const tag = data[offset];
    const { length, bytesRead: lengthBytes } = decodeLength(data, offset + 1);
    const contentStart = offset + 1 + lengthBytes;
    const contentEnd = contentStart + length;

    // 获取标签名称
    let tagName: string;
    switch (tag) {
      case ASN1Tag.INTEGER:
        tagName = 'INTEGER';
        break;
      case ASN1Tag.BIT_STRING:
        tagName = 'BIT_STRING';
        break;
      case ASN1Tag.OCTET_STRING:
        tagName = 'OCTET_STRING';
        break;
      case ASN1Tag.NULL:
        tagName = 'NULL';
        break;
      case ASN1Tag.OBJECT_IDENTIFIER:
        tagName = 'OBJECT_IDENTIFIER';
        break;
      case ASN1Tag.SEQUENCE:
        tagName = 'SEQUENCE';
        break;
      default:
        tagName = `UNKNOWN_TAG_0x${tag.toString(16).padStart(2, '0')}`;
    }

    xml += `${spaces}<${tagName}>\n`;

    if (tag === ASN1Tag.SEQUENCE) {
      // 递归处理 SEQUENCE 内容
      const sequenceContent = data.slice(contentStart, contentEnd);
      xml += asn1ToXml(sequenceContent, indent + 1);
    } else if (tag === ASN1Tag.INTEGER) {
      // 显示 INTEGER 值
      const value = data.slice(contentStart, contentEnd);
      const hexValue = Array.from(value).map(b => b.toString(16).padStart(2, '0')).join('');
      xml += `${spaces}  <value>${hexValue}</value>\n`;
    } else if (tag === ASN1Tag.OCTET_STRING || tag === ASN1Tag.BIT_STRING) {
      // 显示字节内容
      const value = data.slice(contentStart, contentEnd);
      const hexValue = Array.from(value).map(b => b.toString(16).padStart(2, '0')).join('');
      xml += `${spaces}  <value>${hexValue}</value>\n`;
    } else if (tag === ASN1Tag.NULL) {
      // NULL 没有值
      xml += `${spaces}  <value></value>\n`;
    } else {
      // 未知类型，显示原始字节
      const value = data.slice(contentStart, contentEnd);
      const hexValue = Array.from(value).map(b => b.toString(16).padStart(2, '0')).join('');
      xml += `${spaces}  <value>${hexValue}</value>\n`;
    }

    xml += `${spaces}</${tagName}>\n`;

    offset = contentEnd;
  }

  return xml;
}

/**
 * Convert SM2 signature to XML representation
 * @param signature - DER-encoded signature or raw signature (r || s)
 * @param isDer - Whether the signature is DER-encoded (default: auto-detect)
 * @returns XML string representation of the signature
 */
export function signatureToXml(signature: string | Uint8Array, isDer?: boolean): string {
  let derBytes: Uint8Array;

  if (typeof signature === 'string') {
    // 自动检测格式
    if (isDer === undefined) {
      isDer = signature.startsWith('30');
    }

    if (isDer) {
      derBytes = new Uint8Array(signature.length / 2);
      for (let i = 0; i < derBytes.length; i++) {
        derBytes[i] = parseInt(signature.slice(i * 2, i * 2 + 2), 16);
      }
    } else {
      // 原始格式，转换为 DER
      derBytes = rawToDer(signature);
    }
  } else {
    derBytes = signature;
  }

  // 解析签名
  const { r, s } = decodeSignature(derBytes);

  // 生成 XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<SM2Signature>\n';
  xml += '  <r>' + r + '</r>\n';
  xml += '  <s>' + s + '</s>\n';
  xml += '  <DER>\n';
  xml += asn1ToXml(derBytes, 2);
  xml += '  </DER>\n';
  xml += '</SM2Signature>';

  return xml;
}
