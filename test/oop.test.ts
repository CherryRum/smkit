import { describe, it, expect } from 'vitest';
import { SM2, SM3, SM4, ZUC } from '../src/index';
import { CipherMode, PaddingMode, SM2CipherMode } from '../src/types/constants';

describe('Object-Oriented API', () => {
  describe('SM2', () => {
    it('should generate key pair', () => {
      const sm2 = SM2.generateKeyPair();
      expect(sm2.getPublicKey()).toBeTruthy();
      expect(sm2.getPrivateKey()).toBeTruthy();
    });

    it('should create from private key', () => {
      const sm2 = SM2.generateKeyPair();
      const privateKey = sm2.getPrivateKey();

      const sm2FromPrivate = SM2.fromPrivateKey(privateKey);
      expect(sm2FromPrivate.getPrivateKey()).toBe(privateKey);
      expect(sm2FromPrivate.getPublicKey()).toBeTruthy();
    });

    it('should create from public key', () => {
      const sm2 = SM2.generateKeyPair();
      const publicKey = sm2.getPublicKey();

      const sm2FromPublic = SM2.fromPublicKey(publicKey);
      expect(sm2FromPublic.getPublicKey()).toBe(publicKey);
      expect(() => sm2FromPublic.getPrivateKey()).toThrow();
    });

    it('should encrypt and decrypt', () => {
      const sm2 = SM2.generateKeyPair();
      const plaintext = 'Hello, SM2!';

      const encrypted = sm2.encrypt(plaintext);
      expect(encrypted).toBeTruthy();

      const decrypted = sm2.decrypt(encrypted);
      expect(decrypted).toBeTruthy();
    });

    it('should sign and verify', () => {
      const sm2 = SM2.generateKeyPair();
      const data = 'Message to sign';

      const signature = sm2.sign(data);
      expect(signature).toBeTruthy();

      const isValid = sm2.verify(data, signature);
      expect(isValid).toBe(true);
    });

    it('should support custom curve parameters', () => {
      const curveParams = {
        p: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFF',
        a: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFC',
        b: '28E9FA9E9D9F5E344D5A9E4BCF6509A7F39789F515AB8F92DDBCBD414D940E93',
      };

      const sm2 = SM2.generateKeyPair(curveParams);
      expect(sm2.getCurveParams()).toEqual(curveParams);

      sm2.setCurveParams({ ...curveParams, n: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFF7203DF6B21C6052B53BBF40939D54123' });
      expect(sm2.getCurveParams()?.n).toBeTruthy();
    });

    it('should support cipher modes', () => {
      const sm2 = SM2.generateKeyPair();
      const plaintext = 'Hello';

      const encrypted1 = sm2.encrypt(plaintext, SM2CipherMode.C1C3C2);
      expect(encrypted1).toBeTruthy();

      const encrypted2 = sm2.encrypt(plaintext, SM2CipherMode.C1C2C3);
      expect(encrypted2).toBeTruthy();
    });

    it('should perform key exchange', () => {
      const sm2A = SM2.generateKeyPair();
      const sm2B = SM2.generateKeyPair();

      // Generate temporary key pairs
      const tempA = SM2.generateKeyPair();
      const tempB = SM2.generateKeyPair();

      // A initiates key exchange
      const resultA = sm2A.keyExchange(
        sm2B.getPublicKey(),
        tempB.getPublicKey(),
        true,
        { tempPrivateKey: tempA.getPrivateKey() }
      );

      // B responds to key exchange
      const resultB = sm2B.keyExchange(
        sm2A.getPublicKey(),
        tempA.getPublicKey(),
        false,
        { tempPrivateKey: tempB.getPrivateKey() }
      );

      // Both should derive the same shared key
      expect(resultA.sharedKey).toBe(resultB.sharedKey);
      expect(resultA.sharedKey).toBeTruthy();
      expect(resultA.sharedKey).toMatch(/^[0-9a-f]+$/);
    });

    it('should perform key exchange with custom options', () => {
      const sm2A = SM2.generateKeyPair();
      const sm2B = SM2.generateKeyPair();
      const tempA = SM2.generateKeyPair();
      const tempB = SM2.generateKeyPair();

      const resultA = sm2A.keyExchange(
        sm2B.getPublicKey(),
        tempB.getPublicKey(),
        true,
        {
          tempPrivateKey: tempA.getPrivateKey(),
          userId: 'alice',
          peerUserId: 'bob',
          keyLength: 32,
        }
      );

      const resultB = sm2B.keyExchange(
        sm2A.getPublicKey(),
        tempA.getPublicKey(),
        false,
        {
          tempPrivateKey: tempB.getPrivateKey(),
          userId: 'bob',
          peerUserId: 'alice',
          keyLength: 32,
        }
      );

      expect(resultA.sharedKey).toBe(resultB.sharedKey);
      expect(resultA.sharedKey.length).toBe(64); // 32 bytes = 64 hex chars
    });
  });

  describe('SM3', () => {
    it('should compute digest (static)', () => {
      const hash = SM3.digest('Hello, SM3!');
      expect(hash).toMatch(/^[0-9a-f]+$/);
      expect(hash).toHaveLength(64);
    });

    it('should compute HMAC (static)', () => {
      const mac = SM3.hmac('secret-key', 'data');
      expect(mac).toMatch(/^[0-9a-f]+$/);
      expect(mac).toHaveLength(64);
    });

    it('should support incremental hashing', () => {
      const sm3 = new SM3();
      sm3.update('Hello, ').update('SM3!');
      const hash = sm3.digest();
      expect(hash).toMatch(/^[0-9a-f]+$/);
      expect(hash).toHaveLength(64);

      // Should match single digest
      const hashDirect = SM3.digest('Hello, SM3!');
      expect(hash).toBe(hashDirect);
    });

    it('should support reset', () => {
      const sm3 = new SM3();
      sm3.update('data1');
      sm3.reset();
      sm3.update('data2');
      const hash = sm3.digest();

      const hashDirect = SM3.digest('data2');
      expect(hash).toBe(hashDirect);
    });

    it('should handle Uint8Array input', () => {
      const sm3 = new SM3();
      const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      sm3.update(data);
      const hash = sm3.digest();
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('SM4', () => {
    const key = '0123456789abcdeffedcba9876543210';

    it('should encrypt and decrypt with ECB mode', () => {
      const sm4 = new SM4(key, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
      const plaintext = 'Hello, SM4!';

      const encrypted = sm4.encrypt(plaintext);
      expect(encrypted).toMatch(/^[0-9a-f]+$/);

      const decrypted = sm4.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt with CBC mode', () => {
      const iv = 'fedcba98765432100123456789abcdef';
      const sm4 = new SM4(key, { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv });
      const plaintext = 'Hello, SM4 CBC!';

      const encrypted = sm4.encrypt(plaintext);
      expect(encrypted).toMatch(/^[0-9a-f]+$/);

      const decrypted = sm4.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should create with ECB factory method', () => {
      const sm4 = SM4.ECB(key);
      const plaintext = 'Hello';

      const encrypted = sm4.encrypt(plaintext);
      const decrypted = sm4.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should create with CBC factory method', () => {
      const iv = 'fedcba98765432100123456789abcdef';
      const sm4 = SM4.CBC(key, iv);
      const plaintext = 'Hello';

      const encrypted = sm4.encrypt(plaintext);
      const decrypted = sm4.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should get and set mode', () => {
      const sm4 = new SM4(key);
      expect(sm4.getMode()).toBe(CipherMode.ECB);

      sm4.setMode(CipherMode.CBC);
      expect(sm4.getMode()).toBe(CipherMode.CBC);
    });

    it('should get and set padding', () => {
      const sm4 = new SM4(key);
      expect(sm4.getPadding()).toBe(PaddingMode.PKCS7);

      sm4.setPadding(PaddingMode.NONE);
      expect(sm4.getPadding()).toBe(PaddingMode.NONE);
    });

    it('should get and set IV', () => {
      const iv = 'fedcba98765432100123456789abcdef';
      const sm4 = new SM4(key);
      expect(sm4.getIV()).toBeUndefined();

      sm4.setIV(iv);
      expect(sm4.getIV()).toBe(iv);
    });

    it('should handle Uint8Array input', () => {
      const sm4 = SM4.ECB(key);
      const plaintext = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);

      const encrypted = sm4.encrypt(plaintext);
      const decrypted = sm4.decrypt(encrypted);
      expect(decrypted).toBe('Hello');
    });

    it('should create with CTR factory method', () => {
      const iv = '00000000000000000000000000000000';
      const sm4 = SM4.CTR(key, iv);
      const plaintext = 'Hello, CTR!';

      expect(sm4.getMode()).toBe(CipherMode.CTR);
      const encrypted = sm4.encrypt(plaintext);
      const decrypted = sm4.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should create with CFB factory method', () => {
      const iv = 'fedcba98765432100123456789abcdef';
      const sm4 = SM4.CFB(key, iv);
      const plaintext = 'Hello, CFB!';

      expect(sm4.getMode()).toBe(CipherMode.CFB);
      const encrypted = sm4.encrypt(plaintext);
      const decrypted = sm4.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should create with OFB factory method', () => {
      const iv = 'fedcba98765432100123456789abcdef';
      const sm4 = SM4.OFB(key, iv);
      const plaintext = 'Hello, OFB!';

      expect(sm4.getMode()).toBe(CipherMode.OFB);
      const encrypted = sm4.encrypt(plaintext);
      const decrypted = sm4.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('ZUC', () => {
    it('should encrypt and decrypt data', () => {
      const key = '00000000000000000000000000000000';
      const iv = '00000000000000000000000000000000';
      const zuc = new ZUC(key, iv);
      const plaintext = 'Hello, ZUC!';

      const encrypted = zuc.encrypt(plaintext);
      expect(encrypted).toBeTruthy();
      expect(encrypted).toMatch(/^[0-9a-f]+$/);

      const decrypted = zuc.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should allow IV updates', () => {
      const key = '00112233445566778899aabbccddeeff';
      const iv1 = '00000000000000000000000000000000';
      const iv2 = 'ffffffffffffffffffffffffffffffff';
      const zuc = new ZUC(key, iv1);
      const plaintext = 'Test message';

      const encrypted1 = zuc.encrypt(plaintext);

      zuc.setIV(iv2);
      expect(zuc.getIV()).toBe(iv2);

      const encrypted2 = zuc.encrypt(plaintext);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should generate keystream', () => {
      const key = '00000000000000000000000000000000';
      const iv = '00000000000000000000000000000000';
      const zuc = new ZUC(key, iv);

      const keystream = zuc.keystream(4);
      expect(keystream).toHaveLength(32); // 4 words * 8 hex chars
      expect(keystream).toMatch(/^[0-9a-f]+$/);
    });

    it('should support ZUC-128 static factory', () => {
      const key = 'ffffffffffffffffffffffffffffffff';
      const iv = '00000000000000000000000000000000';
      const zuc = ZUC.ZUC128(key, iv);
      const plaintext = 'Test';

      const encrypted = zuc.encrypt(plaintext);
      const decrypted = zuc.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should support EEA3 static method', () => {
      const key = '00000000000000000000000000000000';
      const count = 0x12345678;
      const bearer = 0x15;
      const direction = 0;
      const length = 128;

      const keystream = ZUC.eea3(key, count, bearer, direction, length);
      expect(keystream).toBeTruthy();
      expect(keystream).toMatch(/^[0-9a-f]+$/);
    });

    it('should support EIA3 static method', () => {
      const key = '00000000000000000000000000000000';
      const count = 0x12345678;
      const bearer = 0x15;
      const direction = 0;
      const message = 'Test message';

      const mac = ZUC.eia3(key, count, bearer, direction, message);
      expect(mac).toBeTruthy();
      expect(mac).toHaveLength(8); // 32-bit MAC as 8 hex chars
      expect(mac).toMatch(/^[0-9a-f]+$/);
    });

    it('should work with Uint8Array inputs', () => {
      const key = new Uint8Array(16).fill(0);
      const iv = new Uint8Array(16).fill(1);
      const zuc = new ZUC(key, iv);
      const plaintext = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"

      const encrypted = zuc.encrypt(plaintext);
      expect(encrypted).toBeTruthy();

      const decrypted = zuc.decrypt(encrypted);
      expect(decrypted).toBe('Hello');
    });
  });
});
