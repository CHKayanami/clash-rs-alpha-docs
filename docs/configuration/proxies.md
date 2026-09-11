# 出站代理节点 (Proxies)

`clash-rs` 支持极其丰富的现代出站代理协议、传输伪装层与前沿抗封锁技术。所有的出站节点统一声明在 `proxies:` 列表中。

---

## 协议与特性支持矩阵

| 协议类型 (`type`) | 传输层 / 伪装网络 | 核心特性与亮点 |
| :--- | :--- | :--- |
| **`ss`** (Shadowsocks) | TCP / UDP / obfs / v2ray-plugin / shadow-tls | 支持 SS2022、UDP-over-TCP (UOT)、h2mux 多路复用 |
| **`vless`** | TCP / WS / HTTP2 / gRPC / REALITY | 支持 XTLS-Vision 流控、REALITY 偷证书直连、mTLS |
| **`vmess`** | TCP / HTTP / WS / HTTP2 / gRPC | AEAD 加密、0-RTT 早期数据 (early-data)、mTLS |
| **`trojan`** | TCP / WS / gRPC | 标准 HTTPS 伪装、ALPN 协商、h2mux 多路复用 |
| **`hysteria2`** | UDP (QUIC) | Brutal 拥塞控制、端口跳跃 (Port Hopping)、Salamander 混淆 |
| **`tuic`** | UDP (QUIC) | TUIC v5 极简架构、BBR 拥塞控制、0-RTT、原生/QUIC 双 UDP 模式 |
| **`anytls`** | TLS | 自研抗主动探测协议、支持 mTLS 双向证书与探测回落 |
| **`shadowquic`** | UDP (QUIC) | 基于 QUIC 的定制高性能协议、支持 JLS 认证与 MTU 动态发现 |
| **`wireguard`** | UDP | 纯 Rust 用户态 WireGuard、支持 Cloudflare WARP 保留字节 |
| **`socks5` / `http`** | plain / TLS | 标准通用代理协议、支持密码认证与 TLS 加密包装 |
| **`ssh`** | TCP | SSH 隧道出站、支持密码/私钥、known-hosts 校验及 TOTP 双因子 |
| **`tailscale`** | Mesh VPN | 内置 Tailscale 节点连接（支持 Auth Key 与临时节点模式） |
| **`tor`** | Onion 路由 | 内置洋葱路由隐私出站 |
| **`direct` / `reject`** | 内置出站 | 内置系统直连与丢弃拦截 |

---

## 通用配置选项 (Common Options)

绝大多数出站节点都继承了 `CommonConfigOptions`，支持以下基础字段：

```yaml
proxies:
  - name: "my-node"                 # 节点唯一名称（必填，不可重复）
    type: ss                        # 协议类型（必填）
    server: 1.2.3.4                 # 服务器地址（支持 IPv4 / IPv6 / 域名）
    port: 8388                      # 服务器端口 (1-65535)
    tfo: false                      # 是否开启 TCP Fast Open (降低建连 RTT)
    connect-via: "other-proxy"      # 【前置链式代理】流量先经过此代理发出 (别名: dialer-proxy)
```

::: tip 前置链式代理 (connect-via / dialer-proxy)
在 `clash-rs` 中，你无需通过复杂的 `relay` 策略组，即可在**任意普通代理节点上配置 `connect-via: <另一个节点或策略组名>`**，实现节点之间的自由嵌套前置中继（例如将落地节点通过前置中转节点发出）。
:::

---

## 多路复用 (Multiplexing / smux / h2mux)

针对 **Shadowsocks、VMess、VLESS、Trojan、SOCKS5** 协议，`clash-rs` 原生集成了高性能的 **h2mux** 多路复用引擎。通过单条或少量底层长连接承载并发网络流，极大缩短高并发请求的握手时延，并阻断 ISP 针对高频 TCP 握手的特征探测。

```yaml
smux:                               # 别名: multiplex
  enabled: true                     # 开启多路复用 (别名: enable)
  protocol: h2mux                   # 协议推荐填 h2mux (默认)
  max-connections: 4                # 最大底层载波 TCP 连接数 (默认: 4)
  min-streams: 4                    # 单连接承载的最少并发流数量，超过后开辟新连接 (默认: 4)
  max-streams: 0                    # 单连接最大流数量 (0 表示无限制)
  padding: true                     # 开启随机填充头部，有效抵抗流量特征分析 (防审查推荐)
```

---

## 传输层与 TLS 安全参数 (Transport & Security)

### 1. TLS 基础选项
适用于 VLESS、VMess、Trojan、AnyTLS、Socks5-TLS 等：
- **`tls`**：布尔值，是否启用 TLS 加密传输。
- **`server-name`**（别名 **`sni`**, **`servername`**）：TLS SNI 域名握手标识。
- **`skip-cert-verify`**：布尔值，设为 `true` 时跳过远端 TLS 证书校验（自签证书场景使用）。
- **`alpn`**：应用层协议协商列表（例如 `["h2", "http/1.1"]` 或 `["h3"]`）。
- **`client-fingerprint`**：**客户端 uTLS 指纹模拟**。
  - `clash-rs` 底层基于 **BoringSSL** 引擎实现了真实的 **Chrome uTLS profile** 客户端指纹特征。
  - 推荐值：`chrome` 或 `utls`。
  - 若配置其他兼容名称（如 `firefox`, `safari`, `ios`, `android`, `edge`, `random` 等），核心为保障生态配置兼容性会正常接收，但会在日志中提示 `mapped to Chrome uTLS profile` 并统一以 **Chrome uTLS** 行为发出。
  - 若显式设置为 `"none"`，则完全关闭 BoringSSL uTLS 模拟，回退使用标准的原生 `rustls` 握手。
  - 在 `REALITY` 模式下默认开启 Chrome uTLS，显式配置 `client-fingerprint: none` 可将其关闭。
- **`fingerprint`**：**服务端证书 SHA256 固定校验 (Certificate Pinning)**。
  - 注意：此参数**并非**客户端浏览器指纹，而是用于对远端服务器返回的 TLS 证书公钥哈希进行固定比对校验（如 `"sha256/..."` 或十六进制哈希），常用于防范中间人攻击或绑定自签证书。
- **`ca` / `ca-str`**：自签或私有 CA 证书文件路径或 PEM 字符串。

### 2. mTLS 客户端双向认证
`clash-rs` 支持在节点出站时提供客户端私有证书，实现严格的 mTLS 双向安全认证：
- **`tls-cert`**：客户端证书文件路径或内联 PEM 字符串（`"-----BEGIN CERTIFICATE-----\n..."`）。
- **`tls-key`**：客户端私钥文件路径或内联 PEM 字符串（`"-----BEGIN PRIVATE KEY-----\n..."`）。

### 3. 传输协议伪装参数
通过 `network:` 字段指定传输层类型：

::: code-group

```yaml [WebSocket (ws)]
network: ws
ws-opts:
  path: "/my-ws-path"
  headers:
    Host: "custom.domain.com"
    User-Agent: "Mozilla/5.0"
  max-early-data: 2048              # 0-RTT 早期数据字节大小
  early-data-header-name: Sec-WebSocket-Protocol
```

```yaml [HTTP/2 (h2)]
network: h2
h2-opts:
  host:
    - "domain1.com"
    - "domain2.com"
  path: "/h2-path"
```

```yaml [gRPC (grpc)]
network: grpc
grpc-opts:
  grpc-service-name: "GunService"   # gRPC 服务名
```

```yaml [HTTP (http)]
network: http
http-opts:
  method: "GET"
  path:
    - "/download"
    - "/video"
  headers:
    Host:
      - "domain.com"
```

```yaml [REALITY (reality-opts)]
flow: xtls-rprx-vision              # 必须搭配 Vision 流控
client-fingerprint: chrome          # 必须伪装主流浏览器指纹
reality-opts:
  public-key: "base64-encoded-public-key"
  short-id: "0123456789abcdef"     # 十六进制 short id
```

:::

---

## 协议完整配置范例

### 1. Shadowsocks (`type: ss`)
支持经典 AEAD 与 Shadowsocks 2022 规范：

```yaml
proxies:
  # 经典 Shadowsocks AEAD
  - name: "SS-Legacy"
    type: ss
    server: 1.2.3.4
    port: 8388
    cipher: aes-256-gcm             # 支持: aes-128-gcm, aes-256-gcm, chacha20-ietf-poly1305
    password: "mypassword"
    udp: true
    udp-over-tcp: true              # 开启 UDP over TCP 隧道 (别名: uot)
    connect-via: "Front-Proxy"      # 前置代理节点

  # Shadowsocks 2022 现代规范 (单用户与多用户)
  - name: "SS-2022"
    type: ss
    server: 1.2.3.4
    port: 8390
    cipher: 2022-blake3-aes-256-gcm # 支持: 2022-blake3-aes-128-gcm, 2022-blake3-aes-256-gcm
    password: "base64-32-byte-key=" # 多用户格式为: "server-key:user-key"
    udp: true
    smux:                           # 开启 h2mux 多路复用
      enabled: true
      protocol: h2mux
      padding: true

  # 配合 Simple-obfs 插件
  - name: "SS-Obfs"
    type: ss
    server: 1.2.3.4
    port: 8388
    cipher: aes-256-gcm
    password: "mypassword"
    plugin: obfs
    plugin-opts:
      mode: http                    # http | tls
      host: example.com
```

---

### 2. VLESS (`type: vless`)
支持主流的 VLESS + WebSocket / gRPC / REALITY 架构：

```yaml
proxies:
  # VLESS + REALITY (最强抗封锁推荐)
  - name: "VLESS-REALITY"
    type: vless
    server: 1.2.3.4
    port: 443
    uuid: "b831381d-6324-4d53-ad4f-8cda48b30811"
    flow: xtls-rprx-vision          # 关键流控
    network: tcp
    tls: true
    server-name: "www.apple.com"    # 伪装的偷证书目标域名
    client-fingerprint: chrome      # 浏览器指纹
    reality-opts:
      public-key: "server-reality-public-key"
      short-id: "0123456789abcdef"
    udp: true

  # VLESS + WebSocket + TLS
  - name: "VLESS-WS"
    type: vless
    server: 1.2.3.4
    port: 443
    uuid: "b831381d-6324-4d53-ad4f-8cda48b30811"
    tls: true
    server-name: "node.example.com"
    network: ws
    ws-opts:
      path: "/vless-ws"
      headers:
        Host: "node.example.com"
    udp: true
```

---

### 3. VMess (`type: vmess`)

```yaml
proxies:
  - name: "VMess-Node"
    type: vmess
    server: 1.2.3.4
    port: 443
    uuid: "b831381d-6324-4d53-ad4f-8cda48b30811"
    alterId: 0                      # 推荐设为 0 开启 AEAD 加密认证
    cipher: auto                    # auto | aes-128-gcm | chacha20-poly1305 | none
    udp: true
    tls: true
    server-name: "node.example.com"
    network: ws
    ws-opts:
      path: "/vmess-path"
      max-early-data: 2048
      early-data-header-name: Sec-WebSocket-Protocol
```

---

### 4. Hysteria 2 (`type: hysteria2`)
基于优化版 QUIC 协议构建的高性能代理：

```yaml
proxies:
  - name: "Hysteria2-Node"
    type: hysteria2
    server: 1.2.3.4
    port: 443
    password: "hy2-password"
    sni: "hy2.example.com"
    skip-cert-verify: false
    alpn:
      - h3
    # 端口跳跃 (Port Hopping)：规避针对单一 UDP 端口的 QoS 限速
    ports: "20000-40000"
    # Salamander 协议混淆 (防审查识别)
    obfs: salamander
    obfs-password: "obfs-secret-key"
    # Brutal 拥塞控制宽带提示 (Mbps)
    up: 50
    down: 200
    # QUIC 性能调优选项
    cwnd: 4                         # 初始拥塞窗口大小
    udp-mtu: 1400                   # UDP 载荷 MTU
    disable-mtu-discovery: false    # 是否关闭 MTU 自动探测
```

---

### 5. TUIC v5 (`type: tuic`)
高吞吐极简 QUIC 代理协议：

```yaml
proxies:
  - name: "TUIC-Node"
    type: tuic
    server: 1.2.3.4
    port: 8443
    uuid: "550e8400-e29b-41d4-a716-446655440000"
    password: "tuic-password"
    sni: "tuic.example.com"
    alpn:
      - h3
    # ip: 1.2.3.4                   # 强制指定真实 IP，跳过对 server 的 DNS 解析
    udp-relay-mode: native          # native (原生 datagram) | quic (stream 封装)
    congestion-controller: bbr      # 拥塞控制算法: bbr | cubic | new_reno
    reduce-rtt: true                # 开启 0-RTT 极速握手
    heartbeat-interval: 10000       # 心跳周期 (毫秒)
    request-timeout: 8000           # 请求超时 (毫秒)
    send-window: 16777216           # 发送窗口字节大小 (16MB)
    receive-window: 8388608         # 接收窗口字节大小 (8MB)
    gc-interval: 3000               # 闲置会话 GC 回收周期 (毫秒)
    gc-lifetime: 15000              # 会话存活淘汰时间 (毫秒)
```

---

### 6. WireGuard (`type: wireguard`)
纯 Rust 用户态实现，全面兼容标准 WireGuard 及 Cloudflare WARP：

```yaml
proxies:
  - name: "WARP-Node"
    type: wireguard
    server: 162.159.192.1
    port: 2408
    ip: "172.16.0.2/32"
    ipv6: "2606:4700:110:875a::2/128"
    private-key: "your-base64-private-key="
    public-key: "server-base64-public-key="
    preshared-key: "optional-psk="
    mtu: 1280
    udp: true
    # Cloudflare WARP 专用的保留字节 (Reserved Bytes)
    reserved-bits: [0, 0, 0]
    remote-dns-resolve: true        # 在 WireGuard 隧道内解析 DNS
    dns:
      - 1.1.1.1
      - 8.8.8.8
    allowed-ips:
      - 0.0.0.0/0
      - "::/0"
```

---

### 7. ShadowQUIC (`type: shadowquic`)
集成 JLS 认证的高性能私有 QUIC 代理协议：

```yaml
proxies:
  - name: "ShadowQUIC-Node"
    type: shadowquic
    server: 1.2.3.4
    port: 443
    username: "my-username"
    password: "my-password"
    server-name: "jls.example.com"  # 必须与服务端 JLS 上游域名一致
    alpn:
      - h3
    congestion-control: bbr         # bbr | new-reno | cubic
    zero-rtt: true
    over-stream: false              # true 则使用 stream 传输 UDP
    initial-mtu: 1300               # 高丢包网络推荐设为 1400
    min-mtu: 1290
    keep-alive-interval: 10000      # 毫秒 (0 表示关闭)
    gso: true                       # 开启通用分段卸载
    mtu-discovery: true             # 开启自适应 MTU 探测
```

---

### 8. AnyTLS (`type: anytls`)
具备连接会话池控制与 mTLS 能力的 TLS 代理：

```yaml
proxies:
  - name: "AnyTLS-Node"
    type: anytls
    server: 1.2.3.4
    port: 8443
    password: "anytls-password"
    sni: "anytls.example.com"
    alpn:
      - h2
      - http/1.1
    udp: true
    idle-session-check-interval: 30 # 检查空闲连接间隔 (秒)
    idle-session-timeout: 60        # 空闲会话超时断开 (秒)
    min-idle-session: 1             # 最少保持的热备空闲连接数
    max-connections: 16             # 最大连接池上限
```

---

### 9. SSH 隧道 (`type: ssh`)
支持完整的标准 SSH 出站与双因子二次验证：

```yaml
proxies:
  - name: "SSH-Tunnel"
    type: ssh
    server: 1.2.3.4
    port: 22
    username: "root"
    # 密码认证或私钥认证二选一：
    password: "ssh-password"
    # private-key: "-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----"
    # private-key-passphrase: "key-passphrase"
    # 服务端 host-key 指纹校验：
    host-key:
      - "ssh-ed25519 AAAA..."
    host-key-algorithms:
      - ssh-ed25519
      - rsa-sha2-256
    # TOTP 二次动态口令认证 (支持 otpauth URI)：
    totp-opt:
      otp-auth: "otpauth://totp/Server?secret=JBSWY3DPEHPK3PXP&digits=6&period=30"
```

---

### 10. Tailscale Mesh 节点 (`type: tailscale`)

```yaml
proxies:
  - name: "Tailscale-Node"
    type: tailscale
    auth-key: "tskey-auth-k123456789-abcdef..." # 从 Tailscale 控制台生成的认证 Key
    hostname: "clash-agent"                     # 节点在 Tailscale 网格中的主机名
    state-dir: "/var/lib/clash-rs/tailscale"     # 状态数据保存目录
    ephemeral: true                             # 临时节点：clash-rs 退出后自动在控制台注销此设备
```

---

### 11. Trojan、SOCKS5 与 HTTP

::: code-group

```yaml [Trojan (trojan)]
proxies:
  - name: "Trojan-Node"
    type: trojan
    server: 1.2.3.4
    port: 443
    password: "trojan-password"
    sni: "trojan.example.com"
    alpn: [h2, http/1.1]
    udp: true
    network: grpc                   # 支持 tcp / ws / grpc
    grpc-opts:
      grpc-service-name: "GunService"
```

```yaml [SOCKS5 (socks5)]
proxies:
  # 带认证与 TLS 的 SOCKS5 节点
  - name: "Socks5-TLS"
    type: socks5
    server: 1.2.3.4
    port: 1080
    username: "user"
    password: "password"
    tls: true
    sni: "socks.example.com"
    udp: true
```

```yaml [Tor (tor)]
proxies:
  # 开启内置洋葱路由（无需额外参数）
  - name: "Tor-Exit"
    type: tor
```

:::
