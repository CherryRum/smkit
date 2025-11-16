import { describe, it, expect } from 'vitest';
import {
  OID,
  DEFAULT_USER_ID,
  CipherMode,
  PaddingMode,
  SM2CipherMode,
} from '../src/types/constants';

describe('Constants', () => {
  describe('OID', () => {
    it('should have correct SM2 OID', () => {
      expect(OID.SM2).toBe('1.2.156.10197.1.301');
    });

    it('should have correct SM2_SM3 OID', () => {
      expect(OID.SM2_SM3).toBe('1.2.156.10197.1.501');
    });

    it('should have correct SM3 OID', () => {
      expect(OID.SM3).toBe('1.2.156.10197.1.401');
    });

    it('should have correct SM4 OID', () => {
      expect(OID.SM4).toBe('1.2.156.10197.1.104');
    });

    it('should have EC_PUBLIC_KEY OID for OpenSSL 1.x compatibility reference', () => {
      expect(OID.EC_PUBLIC_KEY).toBe('1.2.840.10045.2.1');
    });
  });

  describe('DEFAULT_USER_ID', () => {
    it('should have correct default user ID', () => {
      expect(DEFAULT_USER_ID).toBe('1234567812345678');
    });
  });

  describe('CipherMode', () => {
    it('should have all cipher modes', () => {
      expect(CipherMode.ECB).toBe('ecb');
      expect(CipherMode.CBC).toBe('cbc');
      expect(CipherMode.CTR).toBe('ctr');
      expect(CipherMode.CFB).toBe('cfb');
      expect(CipherMode.OFB).toBe('ofb');
      expect(CipherMode.GCM).toBe('gcm');
    });

    it('should not expose planned-but-unimplemented modes', () => {
      const modes = Object.values(CipherMode);
      expect(modes).not.toContain('ccm');
      expect(modes).not.toContain('xts');
    });
  });

  describe('PaddingMode', () => {
    it('should have all padding modes', () => {
      expect(PaddingMode.PKCS7).toBe('pkcs7');
      expect(PaddingMode.NONE).toBe('none');
    });
  });

  describe('SM2CipherMode', () => {
    it('should have all SM2 cipher modes', () => {
      expect(SM2CipherMode.C1C3C2).toBe('C1C3C2');
      expect(SM2CipherMode.C1C2C3).toBe('C1C2C3');
    });
  });
});
