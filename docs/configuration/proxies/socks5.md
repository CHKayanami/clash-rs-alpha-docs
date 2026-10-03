# SOCKS5

`type: socks5`，核心协议，支持 TCP 和 SOCKS5 UDP ASSOCIATE。`udp` 默认 `true`，TLS 默认关闭。

## 示例

```yaml
proxies:
  - name: SOCKS5-Node
    type: socks5
    server: socks.example.com
    port: 1080
    username: example-user
    password: example-password
    udp: true
    tls: false
```

## 字段与限制

- `username` / `password` 为可选的用户名密码认证，与服务端匹配。
- `tls: true` 包装到服务端的 TCP 连接，`sni` 默认 `server`，`skip-cert-verify` 默认 `false`。它不会把 UDP 数据通道变成 TLS。
- 支持 `connect-via`，前置节点也必须支持所需的 TCP/UDP 能力。
- 当前不支持浏览器 `client-fingerprint`、证书 `fingerprint`、mTLS 或自定义 ALPN。
- 当前不支持 H2MUX，不要配置 `smux`。

当前没有 HTTP 代理出站 `type: http`。HTTP 代理入口见 [入站配置](/configuration/inbounds)。
