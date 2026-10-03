# AnyTLS

AnyTLS 通过 TLS 加密流量，并自动复用连接，减少频繁建连。节点类型为 `anytls`，支持 TCP/UDP；需要 UDP 时设置 `udp: true`。

## 示例

```yaml
proxies:
  - name: AnyTLS-Node
    type: anytls
    server: anytls.example.com
    port: 443
    password: example-password
    sni: anytls.example.com
    client-fingerprint: chrome
    udp: true
    idle-session-check-interval: 30
    idle-session-timeout: 60
    min-idle-session: 1
    max-connections: 16
    max-streams: 8
```

## 字段与默认值

| 字段 | 默认 / 说明 |
| --- | --- |
| `password` | 必填 |
| `sni` | `server` |
| `alpn` | `[h2, http/1.1]`；与服务端保持一致 |
| `skip-cert-verify` | `false` |
| `fingerprint` / `client-fingerprint` | 指定服务器证书指纹 / 模拟 Chrome 浏览器的 TLS 握手 |
| `tls-cert` / `tls-key` | 可选，必须成对配置 |
| `idle-session-check-interval` | `30` 秒 |
| `idle-session-timeout` | `60` 秒 |
| `min-idle-session` | `1`，希望保留的最少连接数 |
| `max-connections` | `16` |
| `max-streams` | `8`，每条连接同时承载的请求数上限 |

支持前置代理 `connect-via`。连接复用已经内置，不需要再打开 `smux`；也无需填写 `network` 或 `tls`。探测回落是 [AnyTLS 服务端入口](/configuration/inbounds) 的功能，不是节点选项。

TLS 和浏览器指纹细节见 [传输与安全](./transport-security)。
