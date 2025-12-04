---
title: GMKitX 跨语言对照向量
icon: link
order: 99
---

# 跨语言对接（SM2 → SM3 → SM4）

面向 Hutool/Java 以及后续 Go、Python 等实现的互通校验。固定输入、密钥、IV、公私钥在 `test/vectors/interop.json`，便于一次生成、多端共用。

## 文件与约定
- `test/vectors/interop.json`：标准向量；SM3/SM4 已填确定性期望值，SM2 以「解密=原文 / 验签成功」判定。
- `defaults` 提供示例密钥（开发验证用，非生产）。
- 字符串默认 UTF-8，二进制字段小写 hex。

## 验证流程
1. 读取同一 JSON。
2. 按 `algo/op` 调用：SM2（encrypt/sign）、SM3（digest/HMAC 可扩展）、SM4（encrypt/decrypt）。
3. SM2 不比对密文字面与签名字面，只看解密或 `verify`。
4. 新增语言或库：保持字段语义一致，追加用例即可。

## SM2

::: code-tabs#sm2
@tab TypeScript (gmkitx)
```ts
import {
  sm2Encrypt, sm2Decrypt, sign, verify, SM2CipherMode
} from 'gmkitx';
import fs from 'node:fs';

const vec = JSON.parse(fs.readFileSync('test/vectors/interop.json', 'utf8'));

for (const c of vec.cases.filter((v: any) => v.algo === 'SM2')) {
  const pub = c.publicKeyHex ?? vec.defaults.sm2PublicKeyHex;
  const pri = c.privateKeyHex ?? vec.defaults.sm2PrivateKeyHex;

  if (c.op === 'encrypt') {
    const cipher = sm2Encrypt(pub, c.input, { mode: SM2CipherMode[c.mode] });
    const plain = sm2Decrypt(pri, cipher, { mode: SM2CipherMode[c.mode] });
    console.assert(plain === c.input, c.id);
  }
  if (c.op === 'sign') {
    const sig = sign(pri, c.input);
    const ok = verify(pub, c.input, sig);
    console.assert(ok === true, c.id);
  }
}
```

@tab Java (Hutool)
```java
import cn.hutool.crypto.SmUtil;
import cn.hutool.core.util.HexUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Paths;
import java.util.Map;

record Case(String id, String algo, String op, String mode,
            String input, String publicKeyHex, String privateKeyHex,
            Map<String, String> expected) {}

public class SM2Interop {
  public static void main(String[] args) throws Exception {
    var root = new ObjectMapper().readTree(Paths.get("test/vectors/interop.json").toFile());
    var defaults = root.get("defaults");
    for (var node : root.get("cases")) {
      var c = new ObjectMapper().convertValue(node, Case.class);
      if (!"SM2".equals(c.algo())) continue;
      var pri = HexUtil.decodeHex(c.privateKeyHex() != null ? c.privateKeyHex() : defaults.get("sm2PrivateKeyHex").asText());
      var pub = HexUtil.decodeHex(c.publicKeyHex() != null ? c.publicKeyHex() : defaults.get("sm2PublicKeyHex").asText());
      var sm2 = SmUtil.sm2(pri, pub);
      switch (c.op()) {
        case "encrypt" -> {
          var mode = c.mode().equals("C1C2C3") ? SmUtil.SM2EngineMode.C1C2C3 : SmUtil.SM2EngineMode.C1C3C2;
          var cipher = sm2.encryptHex(c.input(), mode);
          var back = sm2.decryptStr(cipher, mode);
          assert back.equals(c.input()) : c.id();
        }
        case "sign" -> {
          var sig = sm2.signHex(c.input());
          assert sm2.verifyHex(c.input(), sig) : c.id();
        }
      }
    }
  }
}
```

@tab Go (占位)
```go
// TODO: 读取 JSON，按 algo/op 分发；SM2 验签/解密，保持 hex 编码。
```

@tab Python (占位)
```python
# TODO: 读取 JSON，按 algo/op 分发；SM2 验签/解密，保持 hex 编码。
```
:::

## SM3

::: code-tabs#sm3
@tab TypeScript (gmkitx)
```ts
import { digest, hmac } from 'gmkitx';
import fs from 'node:fs';

const vec = JSON.parse(fs.readFileSync('test/vectors/interop.json', 'utf8'));

for (const c of vec.cases.filter((v: any) => v.algo === 'SM3')) {
  const out = digest(c.input);
  console.assert(out === c.expected.hex, c.id);
}
// 如需 HMAC，可参照 hmac(key, data) 并扩展 JSON
```

@tab Java (Hutool)
```java
import cn.hutool.crypto.SmUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Paths;

public class SM3Interop {
  public static void main(String[] args) throws Exception {
    var root = new ObjectMapper().readTree(Paths.get("test/vectors/interop.json").toFile());
    var sm3 = SmUtil.sm3();
    for (var node : root.get("cases")) {
      if (!"SM3".equals(node.get("algo").asText())) continue;
      var input = node.get("input").asText();
      var expected = node.get("expected").get("hex").asText();
      var out = sm3.digestHex(input);
      assert out.equals(expected) : node.get("id").asText();
    }
  }
}
```

@tab Go (占位)
```go
// TODO: 使用本地 SM3 实现，对照 expected.hex。
```

@tab Python (占位)
```python
# TODO: 使用 SM3 库，digest 并比对 expected.hex。
```
:::

## SM4

::: code-tabs#sm4
@tab TypeScript (gmkitx)
```ts
import { sm4Encrypt, sm4Decrypt, CipherMode, PaddingMode } from 'gmkitx';
import fs from 'node:fs';

const vec = JSON.parse(fs.readFileSync('test/vectors/interop.json', 'utf8'));

for (const c of vec.cases.filter((v: any) => v.algo === 'SM4')) {
  const key = c.keyHex ?? vec.defaults.sm4KeyHex;
  const opt = {
    mode: CipherMode[c.mode],
    padding: PaddingMode[c.padding],
    iv: c.ivHex,
  };
  const cipher = sm4Encrypt(key, c.input, opt);
  if (c.expected?.cipherHex) console.assert(cipher === c.expected.cipherHex, c.id);
  const plain = sm4Decrypt(key, cipher, opt);
  console.assert(plain === c.input, `${c.id}-decrypt`);
}
```

@tab Java (Hutool)
```java
import cn.hutool.crypto.symmetric.SymmetricAlgorithm;
import cn.hutool.crypto.symmetric.SymmetricCrypto;
import cn.hutool.crypto.Mode;
import cn.hutool.crypto.Padding;
import cn.hutool.core.util.HexUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Paths;

public class SM4Interop {
  public static void main(String[] args) throws Exception {
    var mapper = new ObjectMapper();
    var root = mapper.readTree(Paths.get("test/vectors/interop.json").toFile());
    for (var node : root.get("cases")) {
      if (!"SM4".equals(node.get("algo").asText())) continue;
      var key = HexUtil.decodeHex(node.has("keyHex") ? node.get("keyHex").asText() : root.get("defaults").get("sm4KeyHex").asText());
      var iv = node.has("ivHex") ? HexUtil.decodeHex(node.get("ivHex").asText()) : null;
      var mode = Mode.valueOf(node.get("mode").asText());
      var padding = node.get("padding").asText().equals("PKCS7") ? Padding.PKCS5Padding : Padding.valueOf(node.get("padding").asText());
      var sm4 = new SymmetricCrypto(mode, padding, SymmetricAlgorithm.SM4.getValue(), key, iv);
      var cipher = sm4.encryptHex(node.get("input").asText());
      if (node.get("expected").has("cipherHex")) {
        assert cipher.equals(node.get("expected").get("cipherHex").asText()) : node.get("id").asText();
      }
      var plain = sm4.decryptStr(cipher);
      assert plain.equals(node.get("input").asText()) : node.get("id").asText() + "-decrypt";
    }
  }
}
```

@tab Go (占位)
```go
// TODO: 使用 SM4 实现，按 mode/padding/ivHex 跑加解密并对照 cipherHex / 明文。
```

@tab Python (占位)
```python
# TODO: 使用 SM4 实现，按 mode/padding/ivHex 跑加解密并对照 cipherHex / 明文。
```
:::

## 复用与扩展
- 新增语言/库：保持字段语义一致，直接在 JSON 追加用例，代码 tabs 的占位处补上实现。
- 想覆盖 CTR/OFB/CFB/GCM：先确认各实现计数器/IV/AAD 规则一致，再写入期望值。
- 如需可重复密文/签名（测试场景）：可在本地固定随机源，但请在用例备注中说明；生产环境不建议。 
