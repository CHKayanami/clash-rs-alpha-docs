# VMess

VMess 使用 UUID 识别用户并加密代理流量。节点类型为 `vmess`，支持 TCP/UDP，`udp` 默认开启。

## 示例

```yaml
proxies:
  - name: VMess-WS
    type: vmess
    server: vmess.example.com
    port: 443
    uuid: 00000000-0000-0000-0000-000000000000
    alterId: 0
    cipher: auto
    udp: true
    tls: true
    server-name: vmess.example.com
    client-fingerprint: chrome
    network: ws
    ws-opts:
      path: /vmess-ws
```

## 字段与支持范围

| 字段 | 说明 |
| --- | --- |
| `uuid` | 必填，匹配服务端用户 |
| `alter-id` | 必填，别名 `alterId`；通常填写 `0`，以代理节点的配置为准 |
| `cipher` | 常用 `auto`、`aes-128-gcm`、`chacha20-poly1305`、`none`；按服务端配置选择 |
| `network` | `tcp`、`http`、`ws`、`h2`、`grpc`；省略时使用默认连接方式 |
| `tls` | 默认关闭 |
| `server-name` | 别名 `servername`，TLS 的 SNI |
| `skip-cert-verify` | 默认 `false` |
| `fingerprint` / `client-fingerprint` | 指定服务器证书指纹 / 模拟 Chrome 浏览器的 TLS 握手 |
| `tls-cert` / `tls-key` | 成对配置客户端证书与私钥 |
| `smux` | [H2MUX](./multiplex) |

支持 `connect-via`。VMess 无需配置 `alpn`，会按连接方式自动选择。WebSocket 的提前发送数据功能需要服务端配套支持。

不支持 `network: raw`、`xhttp` 或 REALITY。详见 [传输与安全](./transport-security)。
