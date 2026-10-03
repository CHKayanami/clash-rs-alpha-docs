# 出站代理节点 (Proxies)

代理节点决定流量通过哪台服务器访问目标网站或服务，写在配置文件的 `proxies:` 列表中。先确认代理节点使用的协议类型，再通过左侧子菜单查看对应的配置示例。

网页浏览、下载等通常使用 TCP，游戏、语音通话等还可能需要 UDP。启用 UDP 时，节点和服务端都需要支持。

## 协议与特性支持矩阵

| 协议 | 支持的功能 |
| --- | --- |
| [`ss`](./proxies/shadowsocks) | 加密代理、TCP/UDP、SS2022、插件、UDP over TCP、连接复用 |
| [`vless`](./proxies/vless) | TCP/UDP、多种传输方式、TLS/REALITY、Vision、Encryption、XHTTP |
| [`vmess`](./proxies/vmess) | 加密代理、TCP/UDP、多种传输方式、TLS、连接复用 |
| [`trojan`](./proxies/trojan) | TLS 加密、TCP/UDP、WebSocket/gRPC、连接复用 |
| [`hysteria2`](./proxies/hysteria2) | TCP/UDP、带宽设置、端口跳跃、Salamander 混淆 |
| [`tuic`](./proxies/tuic) | TCP/UDP、连接恢复、拥塞控制设置 |
| [`anytls`](./proxies/anytls) | TLS 加密、TCP/UDP、连接复用、客户端证书认证 |
| [`shadowquic`](./proxies/shadowquic) | TCP/UDP、JLS 认证、连接恢复、MTU 调整 |
| [`wireguard`](./proxies/wireguard) | 访问 WireGuard 隧道网络、TCP/UDP、隧道内 DNS |
| [`socks5`](./proxies/socks5) | 标准 SOCKS5 代理、TCP/UDP、用户名密码、TLS |
| [`ssh`](./proxies/ssh) | 通过 SSH 服务器转发 TCP、密码/私钥认证、动态口令 |
| [`tailscale`](./proxies/tailscale) | 访问 Tailscale 网络、TCP/UDP、保存设备身份 |
| [`tor`](./proxies/tor) | 通过 Tor 网络访问目标、支持 TCP |
| [`direct`](./proxies/direct) | 不经过代理，直接访问目标 |
| [`reject`](./proxies/reject) | 阻止匹配的连接 |

当前不支持 HTTP 代理节点（`type: http`）。应用程序仍可连接 clash-rs 的 HTTP 代理入口；VMess/VLESS 中的 `network: http` 是另一种节点传输设置。

## 通用配置选项

下面是一个 Shadowsocks 节点示例。填写服务端地址、端口和认证信息后，再加入策略组或在规则中引用它：

```yaml
proxies:
  - name: SS-Node
    type: ss
    server: proxy.example.com
    port: 8388
    cipher: aes-256-gcm
    password: example-password
    udp: true
    tfo: false
    # connect-via: Front-Proxy
```

| 字段 | 说明 |
| --- | --- |
| `name` | 节点名称，必须唯一 |
| `type` | 协议类型，使用上表中的值 |
| `server` / `port` | 服务端域名或 IP 与端口；Tor、Tailscale、direct、reject 不使用这对字段 |
| `tfo` | 尝试缩短 TCP 建连时间，默认关闭；可用于 SS、Trojan、VLESS，需要网络和服务端支持 |
| `connect-via` | 先经过另一个节点或策略组，再连接此节点；别名 `dialer-proxy`，支持范围见下文 |
| `udp` | 是否允许该节点承载 UDP；支持范围与默认值见各协议页，不是所有节点都有此字段 |

### 前置链式代理

SS、SOCKS5、AnyTLS、Trojan、VMess 和 VLESS 支持 `connect-via`。例如，给落地节点设置 `connect-via: Front-Proxy`，它会先经过 Front-Proxy，再连接自己的服务器。

前置目标可以是配置中的节点或策略组。订阅中的节点请先加入策略组，再使用该组名称。

Hysteria2、TUIC、ShadowQUIC、WireGuard、Tailscale、Tor 和 SSH 当前不支持这项设置。

## 传输层与 TLS 安全参数

见 [传输层、TLS 与浏览器指纹](./proxies/transport-security)。SNI 字段名、ALPN、mTLS 和证书固定校验按协议区分，不应将其他协议的字段直接复制过来。

## 多路复用

连接复用让多个请求共用已有连接，减少反复建连。SS、Trojan、VMess 和未启用 Encryption 的 VLESS 可以使用 [H2MUX](./proxies/multiplex)。AnyTLS 自带复用，XHTTP 可通过 `reuse-settings` 单独设置；SOCKS5 当前不支持 H2MUX。

## VLESS 扩展

- [VLESS Encryption](./proxies/vless-encryption)：加密模式、握手、Vision 组合。
- [XHTTP](./proxies/xhttp)：上传模式、独立下行、HTTP 连接复用和 请求设置和数据填充。

所有示例均使用示例地址与凭据。部署时替换为服务端实际参数；包含公钥、私钥或证书占位符的片段不能直接运行。
