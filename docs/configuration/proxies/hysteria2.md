# Hysteria 2

Hysteria 2 支持 TCP/UDP，可以设置带宽、端口跳跃和流量混淆。节点类型为 `hysteria2`；UDP 需要服务端允许，当前不支持前置代理 `connect-via`。

## 示例

```yaml
proxies:
  - name: Hysteria2-Node
    type: hysteria2
    server: hy2.example.com
    port: 443
    password: example-password
    sni: hy2.example.com
    skip-cert-verify: false
    alpn: [h3]
    # ports: "20000-30000,35000"
    # obfs: salamander
    # obfs-password: example-obfs-password
    # up: 50
    # down: 200
```

## 认证与端口跳跃

`name`、`server`、`port`、`password` 必填。`sni` 未指定时使用服务端域名；IP 地址场景应填写证书对应名称。`alpn` 省略或为空时使用 `[h3]`。

`ports` 接受单个端口、范围及逗号组合，需要服务端和网络路径配套支持。混淆目前仅支持 `obfs: salamander`，配置后 `obfs-password` 必填。

## 带宽与 QUIC 参数

| 字段 | 默认 / 说明 |
| --- | --- |
| `up` | 未设置；数字按 Mbps，字符串可含单位（如 `50 Mbps`、`10 MB/s`）。上行大于 `0` 时启用 Brutal，否则使用 BBR |
| `down` | 未设置；下行带宽提示，用于与服务端协商，不单独决定本地拥塞算法 |
| `max-stream-receive-window` | `8388608` 字节（8 MiB） |
| `max-connection-receive-window` | `20971520` 字节（20 MiB） |
| `udp-mtu` | 通常不用设置，限制单个 UDP 包的大小 |
| `disable-mtu-discovery` | `false` |
| `skip-cert-verify` | `false` |
| `fingerprint` | 服务器证书的 SHA-256 指纹，填写连续的 64 位十六进制字符 |
| `tls-cert` / `tls-key` | 成对的 mTLS 客户端证书与私钥，可用文件路径或内联 PEM |
| `ca` | 当前不支持，设置会报错 |
| `ca-str` | 当前不支持自定义 CA，请勿使用 |

普通使用可以保留默认的 `alpn: [h3]`。无需填写浏览器指纹或 H2MUX 配置。
