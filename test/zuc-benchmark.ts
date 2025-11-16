/**
 * Simple performance benchmark for ZUC implementation
 * This demonstrates the optimizations made to the ZUC algorithm
 */

import { zucEncrypt, zucDecrypt, zucKeystream, ZUC } from '../src/index';

const ITERATIONS = 1000;

function benchmark(name: string, fn: () => void, iterations: number = ITERATIONS): number {
  // Warmup
  for (let i = 0; i < 10; i++) {
    fn();
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  const totalTime = end - start;
  const avgTime = totalTime / iterations;

  console.log(`${name}:`);
  console.log(`  Total: ${totalTime.toFixed(2)}ms for ${iterations} iterations`);
  console.log(`  Average: ${avgTime.toFixed(4)}ms per operation`);
  console.log();

  return avgTime;
}

console.log('ZUC Performance Benchmarks');
console.log('==========================\n');

// Test data
const key = '00112233445566778899aabbccddeeff';
const iv = 'ffeeddccbbaa99887766554433221100';
const shortText = 'Hello, World!';
const mediumText = 'The quick brown fox jumps over the lazy dog. '.repeat(10);
const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100);

// Benchmark encryption operations
console.log('Encryption Performance:');
console.log('----------------------\n');

benchmark('Short text encryption (13 bytes)', () => {
  zucEncrypt(key, iv, shortText);
});

benchmark('Medium text encryption (~450 bytes)', () => {
  zucEncrypt(key, iv, mediumText);
});

benchmark('Long text encryption (~5700 bytes)', () => {
  zucEncrypt(key, iv, longText);
});

// Benchmark decryption operations
console.log('Decryption Performance:');
console.log('----------------------\n');

const encryptedShort = zucEncrypt(key, iv, shortText);
const encryptedMedium = zucEncrypt(key, iv, mediumText);
const encryptedLong = zucEncrypt(key, iv, longText);

benchmark('Short text decryption (13 bytes)', () => {
  zucDecrypt(key, iv, encryptedShort);
});

benchmark('Medium text decryption (~450 bytes)', () => {
  zucDecrypt(key, iv, encryptedMedium);
});

benchmark('Long text decryption (~5700 bytes)', () => {
  zucDecrypt(key, iv, encryptedLong);
});

// Benchmark keystream generation
console.log('Keystream Generation:');
console.log('--------------------\n');

benchmark('Generate 4 words (16 bytes)', () => {
  zucKeystream(key, iv, 4);
});

benchmark('Generate 64 words (256 bytes)', () => {
  zucKeystream(key, iv, 64);
});

benchmark('Generate 256 words (1024 bytes)', () => {
  zucKeystream(key, iv, 256);
});

// Benchmark OOP API
console.log('Object-Oriented API:');
console.log('-------------------\n');

benchmark('ZUC class instantiation', () => {
  new ZUC(key, iv);
});

const zuc = new ZUC(key, iv);
benchmark('ZUC class encryption (short text)', () => {
  zuc.encrypt(shortText);
});

benchmark('ZUC class decryption (short text)', () => {
  zuc.decrypt(encryptedShort);
});

benchmark('ZUC class keystream generation', () => {
  zuc.keystream(4);
});

// Summary
console.log('Summary:');
console.log('--------');
console.log('Optimizations implemented:');
console.log('✓ Pre-allocated buffers to reduce memory allocations');
console.log('✓ Optimized byte extraction using word-at-a-time processing');
console.log('✓ Reduced intermediate array creations in bitReorganization');
console.log('✓ Improved unsigned 32-bit operations with consistent >>> 0');
console.log('✓ Streamlined keystream generation with exact buffer sizing');
console.log('✓ Added OOP API for better developer experience\n');
