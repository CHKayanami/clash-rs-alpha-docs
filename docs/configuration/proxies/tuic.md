# TUIC v5

TUIC 支持 TCP/UDP，可以调整连接恢复、拥塞控制和 UDP 转发方式。节点类型为 `tuic`，使用 TUIC v5；当前不支持前置代理 `connect-via`。

## 示例

```yaml
proxies:
  - name: TUIC-Node
    type: tuic
    server: tuic.example.com
    port: 443
    uuid: 00000000-0000-0000-0000-000000000000
    password: example-password
    sni: tuic.example.com
    alpn: [h3]
    udp-relay-mode: native
    congestion-controller: bbr
    reduce-rtt: false
```

## 字段与默认值

| 字段 | 默认 / 说明 |
| --- | --- |
| `uuid` / `password` | 必填，TUIC v5 用户认证 |
| `ip` | 可选，覆盖 `server` 的 DNS 结果；`server` 仍用于服务器名称 |
| `sni` | 可选服务器名称覆盖 |
| `disable-sni` | `false` |
| `alpn` | `[h3]` |
| `udp-relay-mode` | `native`（默认方式）；也可按服务端要求使用 `quic` |
| `congestion-controller` | `bbr`；支持 `bbr`、`bbr3`、`cubic`、`new_reno`（也接受 `newreno`） |
| `reduce-rtt` / `fast-open` | 默认关闭；开启后尝试缩短已有会话的重新连接时间，需要服务端支持 |
| `heartbeat-interval` | `3000` 毫秒 |
| `request-timeout` | `4000` 毫秒，也用于空闲超时 |
| `max-open-stream` | `32` |
| `max-udp-relay-packet-size` | `1500` 字节 |
| `gc-interval` / `gc-lifetime` | `3000` / `15000` 毫秒 |
| `send-window` / `receive-window` | `16777216` / `8388608` 字节 |
| `skip-cert-verify` | `false` |
| `tls-cert` / `tls-key` | 成对的 mTLS 客户端证书与私钥 |

`udp-relay-mode` 必须与服务端匹配。大多数情况下使用默认值即可；不需要填写 `network`、`smux` 或浏览器指纹。
