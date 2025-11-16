import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [dts({ rollupTypes: true })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SMKit',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'smkit.js';
        if (format === 'cjs') return 'smkit.cjs';
        if (format === 'umd') return 'smkit.umd.js';
        return `smkit.${format}.js`;
      },
    },
    rollupOptions: {
      external: [],
      output: {
        exports: 'named', // 修复警告：只使用命名导出
      },
    },
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
  },
});
