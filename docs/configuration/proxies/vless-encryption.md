# VLESS Encryption

Encryption 为 VLESS 增加加密保护。只有服务端启用了相应功能时才需要配置，请直接复制服务端提供的 `encryption` 字符串。它可以与 TLS、REALITY 以及不同传输方式搭配。

## 格式与模式

```yaml
encryption: mlkem768x25519plus.native.0rtt.<SERVER_PUBLIC_KEY>
```

必须替换公钥占位符，不能直接启动。

| 部分 | 支持值 |
| --- | --- |
| 协议 | `mlkem768x25519plus` |
| 模式 | `native`、`xorpub`、`random` |
| 握手 | `0rtt`、`1rtt` |
| 认证公钥 | 服务端提供的 Encryption 公钥，不能用 REALITY 公钥代替 |

模式、握手选项和公钥都必须与服务端匹配。服务端提供的字符串可能还包含填充或多个公钥参数，应完整复制，不要删改。

`0rtt` / `1rtt` 是服务端提供的握手选项，按原样填写即可。省略、空字符串或 `none` 表示不启用 Encryption。

## 组合限制

- 可以与普通 TLS 或 REALITY 作为外层安全组合，也可以不使用外层 TLS。
- 可以搭配 `flow: xtls-rprx-vision`。XHTTP 上的 Vision 必须启用 Encryption。
- 不能与启用的 `smux` / `multiplex` 同时使用。
- 可以使用 XHTTP 的 `reuse-settings`，这是 HTTP 连接复用，不是 H2MUX。
- 支持 UDP，`udp` 默认开启。

完整 XHTTP 配置见 [XHTTP](./xhttp)。
