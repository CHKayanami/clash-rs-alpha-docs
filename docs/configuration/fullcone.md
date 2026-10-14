# UDP FullCone NAT 支持 🎮

`clash-rs` 重构了底层的 UDP NAT 会话调度机制，在入站与出站代理链路中全面支持 **FullCone NAT（全锥形 NAT / NAT1）**。

在开启 FullCone 支持后，局域网内的客户端（如 Nintendo Switch、PlayStation、Xbox 主机、PC 联机游戏及 P2P 应用）能够获得最佳的网络连通性，消除因 NAT 类型受限（如 Symmetric NAT / NAT4）导致的无法联机、无法加入房间或语音失效等问题。

---

## 什么是 FullCone NAT？

在 NAT（网络地址转换）分类中，FullCone NAT（全锥形 NAT，通常被称为 **NAT1**）是最宽松、连通性最好的类型：

- 一旦内部主机（IP:Port）通过 NAT 映射向外部目标发送数据报文，该映射就会在网关上建立一个固定的公共 IP 和外部端口；
- **任何外部主机**随后只要向该公共 IP 和端口发送 UDP 数据包，NAT 网关都会如实将其转发至该内部主机；
- 该特性对于 **P2P 联机游戏**、**BT / PT 下载** 以及 **WebRTC / VoIP 实时音视频通信** 至关重要。

---

## 达成 FullCone 的必要条件

FullCone NAT 的建立需要整条网络链路（入站 -> 核心调度 -> 出站 -> 节点服务端）协同工作。客户端开启 FullCone 需满足以下条件：

### 1. 前置条件

| 检查项 | 要求与说明 |
| :--- | :--- |
| **入站目标为真实 IP** | 客户端发起的 UDP 连接目标必须是 **真实 IP 地址 (Real IP)**。<br>• 推荐在 DNS 配置中使用 `redir-host` 模式或直连真实公网 IP。<br>• ⚠️ **Fake-IP 模式限制**：如果客户端通过 Fake-IP（如 `198.18.0.x`）发包，由于远端主动回包时无法将未知来源的对端 IP 还原为虚拟会话，因此无法达成全锥形映射。 |
| **未启用域名目标覆写** | 在域名嗅探器（`sniffer`）或特定入站协议中，**不能启用域名覆写目标**（即保持 `override-destination: false`）。若将目标覆写为域名，UDP 连接将转为域名解析出站，从而破坏固定的 IP:Port NAT 映射。 |
| **服务端与上级网络支持** | • **代理节点出站**：实际能否达成 NAT1，还取决于代理节点服务端本身是否支持并放行 FullCone UDP 转发。<br>• **Direct 直连出站**：取决于本地家庭宽带 ISP 的分配（是否有公网 IP / 上级光猫是否开启 FullCone / UPnP）。 |

---

## 支持的入站类型 (Inbounds)

以下入站模式支持接收并维持 FullCone NAT 会话：

- **TUN**：全局或分流虚拟网卡接管
- **TProxy**：Linux `iptables` / `nftables` 透明代理
- **eBPF**：Linux 内核态 TC 线速透明代理
- **SOCKS5**：支持 SOCKS5 UDP Associate（客户端发送目标真实 IP）

---

## 支持的出站协议 (Outbounds)

`clash-rs` 核心出站模块在以下协议中完整实现了 FullCone UDP NAT 的双向中继与端到端源地址保持：

- **Direct**（直连出站）
- **Shadowsocks UDP / UOT**（UDP over TCP）
- **Trojan UDP**
- **SOCKS5 UDP**
- **Hysteria2 UDP**
- **TUIC UDP**
- **AnyTLS UDP**
- **H2MUX UDP**
- **VLESS XUDP**

> [!NOTE]
> 以上协议列表代表 `clash-rs` 客户端具备 FullCone UDP 转发与会话保活能力。若出站节点背后的服务端不支持 FullCone，对端仍可能探测为受限型 NAT。

---

## 最佳配置实践

如果你希望为游戏主机或联机客户端提供稳健的 FullCone NAT 体验，推荐按照以下建议进行配置：

### 1. DNS 配置建议

达成 FullCone NAT 的首要前提是**客户端入站目标为真实 IP**。若全局启用了 Fake-IP，必须将游戏相关域名分流至真实 DNS 上游解析（如 `1.1.1.1`）并排除在 Fake-IP 池之外；若使用纯 Redir-Host 则直接指向真实上游。

#### 方案 A：更灵活的 DNS (`dns2`) 配置（推荐）

通过 `dns2` 的上游端点池与 `request` 请求阶段路由，精确将游戏域名指派给真实 DNS 上游 `1.1.1.1`，其余代理流量进入 `fakeip-dns`：

```yaml
dns2:
  enable: true

  # 1. 定义上游端点池
  upstreams:
    # 真实 IP 解析上游（为游戏与 FullCone 业务提供真实公网 IP）
    - tag: real-dns
      type: remote
      server:
        - 1.1.1.1
    # 国内日常解析上游
    - tag: direct-dns
      type: remote
      server:
        - 223.5.5.5
        - 119.29.29.29
    # Fake-IP 虚拟池（供常规网页/流媒体出站代理使用）
    - tag: fakeip-dns
      type: fakeip
      inet4-range: 198.18.0.1/16

  # 2. 阶段一：Request 域名路由规则
  routing:
    request:
      # 游戏域名精确路由至真实 DNS，获取真实 IP
      - domain-suffix:
          - nintendo.net
          - nintendo.com
          - playstation.net
          - playstation.com
          - xboxlive.com
          - ea.com
          - steampowered.com
        upstream: real-dns

      # 常见海外代理域名走 Fake-IP 虚拟映射
      - domain-suffix:
          - google.com
          - youtube.com
          - github.com
        upstream: fakeip-dns

      # 兜底默认走直连 DNS
      - fallback: direct-dns
```

#### 方案 B：传统 DNS (`dns`) 配置

若使用传统 `dns` 引擎，使用 `nameserver-policy` 策略路由将游戏域名指向 `1.1.1.1`，并配置 `fake-ip-filter` 避免被分配 Fake-IP：

```yaml
dns:
  enable: true
  enhanced-mode: fake-ip
  nameserver:
    - 223.5.5.5
    - 119.29.29.29

  # 将游戏域名策略分流给真实 DNS 上游 1.1.1.1
  nameserver-policy:
    "+.nintendo.net": 1.1.1.1
    "+.nintendo.com": 1.1.1.1
    "+.playstation.net": 1.1.1.1
    "+.playstation.com": 1.1.1.1
    "+.xboxlive.com": 1.1.1.1
    "+.ea.com": 1.1.1.1
    "+.steampowered.com": 1.1.1.1

  # 将游戏域名从 Fake-IP 列表中排除，强制返回真实 IP
  fake-ip-filter:
    - "+.nintendo.net"
    - "+.nintendo.com"
    - "+.playstation.net"
    - "+.playstation.com"
    - "+.xboxlive.com"
    - "+.ea.com"
    - "+.steampowered.com"
```

---

### 2. 嗅探器（Sniffer）配置

保持嗅探器的 `override-destination` 处于关闭状态（默认即为 `false`）：

```yaml
sniffer:
  enable: true
  parse-pure-ip: true
  override-destination: false # 必须为 false，避免破坏真实 IP 的 UDP NAT 映射
```

---

### 3. 分流规则建议

将游戏主机的 STUN 探测、联机语音及常用游戏端口/域名分流至支持 FullCone 的出站代理或 `DIRECT` 直连（使用 `DOMAIN-SUFFIX` 与端口规则，避免依赖传统的全量 `GEOSITE`）：

```yaml
rules:
  # 1. 常见 STUN 测速与联机语音 UDP 端口
  - DST-PORT,3478,🎮 游戏出站
  - DST-PORT,3479,🎮 游戏出站
  - DST-PORT,3074,🎮 游戏出站 # Xbox Live / COD 联机端口
  - DST-PORT,3659,🎮 游戏出站 # EA 对战常用 UDP 端口

  # 2. 游戏联机服务域名分流 (使用 DOMAIN-SUFFIX，不使用 GEOSITE)
  - DOMAIN-SUFFIX,nintendo.net,🎮 游戏出站
  - DOMAIN-SUFFIX,nintendo.com,🎮 游戏出站
  - DOMAIN-SUFFIX,playstation.net,🎮 游戏出站
  - DOMAIN-SUFFIX,playstation.com,🎮 游戏出站
  - DOMAIN-SUFFIX,xboxlive.com,🎮 游戏出站
  - DOMAIN-SUFFIX,ea.com,🎮 游戏出站
  - DOMAIN-SUFFIX,steampowered.com,🎮 游戏出站
  - DOMAIN-KEYWORD,stun,🎮 游戏出站

  - MATCH,🎯 节点选择
```
