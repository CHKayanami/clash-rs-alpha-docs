# WireGuard

WireGuard 用于通过加密隧道访问网络，支持 TCP/UDP，例如连接自己的 VPN 或兼容的隧道服务。节点类型为 `wireguard`，当前不支持前置代理 `connect-via`。

## 示例

```yaml
proxies:
  - name: WireGuard-Node
    type: wireguard
    server: wg.example.com
    port: 51820
    ip: 10.0.0.2/32
    private-key: <PRIVATE_KEY>
    public-key: <PEER_PUBLIC_KEY>
    mtu: 1280
    udp: true
    remote-dns-resolve: false
    allowed-ips:
      - 0.0.0.0/0
      - "::/0"
```

替换密钥为 Base64 编码的 32 字节 WireGuard 密钥；`public-key` 是对端公钥。

## 字段

| 字段 | 默认 / 说明 |
| --- | --- |
| `ip` | 必填，带前缀长度的 IPv4 地址，如 `10.0.0.2/32` |
| `ipv6` | 可选，带前缀长度的 IPv6 地址 |
| `private-key` / `public-key` | 必填，配置阶段验证密钥格式 |
| `pre-shared-key` | 可选，别名 `preshared-key` |
| `mtu` | 可选，隧道 MTU |
| `udp` | 默认 `false`，需要 UDP 时显式启用 |
| `remote-dns-resolve` | 默认 `false`；通过隧道内 DNS 解析目标域名 |
| `dns` | 隧道内 DNS 服务器列表 |
| `allowed-ips` | 对端允许的目标网段 |
| `reserved-bits` | 可选保留字节，例如 `[0, 0, 0]`，按对端要求设置 |

启用远端解析时配置合适的隧道内 `dns`。节点服务器自身的解析仍是建立隧道的前置步骤。没有 TLS、浏览器指纹、`network` 或 `smux` 参数。
