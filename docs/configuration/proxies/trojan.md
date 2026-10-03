# Trojan

Trojan 使用密码认证，并通过 TLS 加密流量。节点类型为 `trojan`；需要游戏、语音等 UDP 流量时设置 `udp: true`，默认关闭。

## 示例

```yaml
proxies:
  - name: Trojan-gRPC
    type: trojan
    server: trojan.example.com
    port: 443
    password: example-password
    sni: trojan.example.com
    client-fingerprint: chrome
    network: grpc
    grpc-opts:
      grpc-service-name: GunService
    udp: true
```

## 字段与支持范围

| 字段 | 说明 |
| --- | --- |
| `password` | 必填，与服务端一致 |
| `network` | `tcp`、`ws`、`grpc`；省略时直接使用 Trojan over TLS |
| `sni` | 默认使用 `server` |
| `alpn` | 省略时 WS 使用 `[http/1.1]`，其他路径使用 `[h2, http/1.1]`；gRPC 应协商 H2 |
| `skip-cert-verify` | 默认 `false` |
| `fingerprint` / `client-fingerprint` | 指定服务器证书指纹 / 模拟 Chrome 浏览器的 TLS 握手 |
| `tls-cert` / `tls-key` | 成对配置客户端证书与私钥 |
| `smux` | [H2MUX](./multiplex) |

支持 `connect-via`、`tfo`。无需配置 `tls: true`，也不能用 `tls: false` 关闭 TLS。`network: http`、`h2`、`xhttp` 和 REALITY 不受支持。

WS / gRPC 参数见 [传输与 TLS](./transport-security)。
