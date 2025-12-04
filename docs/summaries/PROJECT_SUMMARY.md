---
title: 项目总结
icon: clipboard-list
order: 1
author: mumu
date: 2025-11-23
category:
  - 技术总结
  - 项目
tag:
  - 项目总结
  - 技术栈
---

# GMKit Project Summary

> 本页收敛成可用的状态说明，避免夸大：以当前仓库为准，后续变更再补充。

## 当前范围
- 算法：SM2（基于 @noble/curves）、SM3、SM4、ZUC、SHA 家族。
- 工具：输入/输出格式转换、随机数获取（含安全源优先的回退策略）。
- 入口：`src/index.ts` 提供按需函数与类导出，保持 tree-shaking 友好。

## 当前状态
- 构建：使用 tsup 输出 ESM/CJS/UMD 与类型定义（见 `dist/`），面向 Node 和浏览器。
- 依赖：仅运行时依赖 @noble/curves/@noble/hashes；其余为开发工具链。
- 测试与类型：Vitest 用例覆盖核心路径；TypeScript `--noEmit` 校验常态化。
- SM2：签名/验签、加解密基于标准曲线参数；仍需更多标准向量与互操作验证。
- 文档与示例：VuePress 文档、Vue demo 在仓库内，可本地 `npm run docs:dev`/`demo:vue`。

## 风险与待办
- 安全：尚未做第三方审计；生产前请在目标环境复核随机源与关键路径实现。
- 兼容：老版本用户 ID（SM2）与新标准的差异需按业务选择，建议自测。
- 测试：补充 SM2/ZUC 互操作与性能基准；覆盖更多异常路径与边界值。
- 文档：精简仍需的教程，删除过时信息，保持与代码同步。

```
gmkit/
├── .github/
│   └── workflows/
│       └── ci.yml           # CI/CD configuration
├── src/
│   ├── index.ts            # Main entry point
│   ├── sm2.ts              # SM2 implementation
│   ├── sm3.ts              # SM3 implementation
│   ├── sm4.ts              # SM4 implementation
│   └── utils.ts            # Utility functions
├── test/
│   ├── sm2.test.ts         # SM2 tests
│   ├── sm3.test.ts         # SM3 tests
│   ├── sm4.test.ts         # SM4 tests
│   └── utils.test.ts       # Utils tests
├── dist/                   # Build output (gitignored)
├── .editorconfig           # Editor configuration
├── .gitignore              # Git ignore rules
├── .npmignore              # npm package ignore rules
├── CHANGELOG.md            # Version history
├── LICENSE                 # Apache 2.0 license
├── README.md               # User documentation
├── examples.ts             # Usage examples
├── package.json            # Package configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Build configuration
```

## Compliance

- ✅ **Purity**: Zero runtime dependencies
- ✅ **Performance**: Uint8Array for all internal operations
- ✅ **Modern**: TypeScript with ES Modules
- ✅ **Isomorphic**: Node.js and browser compatible
- ✅ **Functional**: Pure functions throughout
- ✅ **Tree-shakable**: Individual function exports
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Tested**: Comprehensive test suite
- ✅ **Documented**: API docs and examples

## Known Limitations

1. **SM2**: Current implementation is a placeholder. Full elliptic curve operations need to be implemented.
2. **Performance**: Not yet optimized for high-throughput scenarios.
3. **Test Vectors**: Integration with external test vectors repository pending.
4. **Browser Support**: Not yet tested in all browsers (expected to work in modern browsers).

## License

Apache License 2.0 - See LICENSE file for details.
