# 旁路由透明代理实战 (TUN / eBPF)

本指南针对 OpenWrt 软路由、Ubuntu/Debian 旁路网关或家庭服务器设备，提供使用 **TUN** 或 **eBPF** 两种方案实现全屋设备免客户端接入代理的完整实战配置。

---

## 方案一：Linux eBPF 内核线速透明代理 (推荐)

如果你运行在 Linux (内核版本 >= 5.15) 上，强烈推荐使用基于 TC 的 eBPF 模式。它具备内核态直连快路径自动卸载（Direct Offload），极大降低软路由 CPU 占用。

### 实战配置 (`config.yaml`)

```yaml
# 运行模式与基础监听
mode: rule
log-level: info
allow-lan: true
bind-address: "*"

# 外部控制面板
external-controller: 0.0.0.0:9090
secret: "my_gateway_secret"

# 启用域名嗅探（透明代理必备，提取真实域名）
sniffer:
  enable: true
  force-dns-mapping: true
  parse-pure-ip: true
  sniff:
    TLS:
      ports: [443, 8443]
    HTTP:
      ports: [80, "8080-8880"]
      override-destination: true
    QUIC:
      ports: [443]

# eBPF 内核透明代理子系统
ebpf:
  enable: true
  lan-interface: ["auto"]    # 自动发现 br-lan 或物理网卡
  wan-interface: "auto"      # 外网出站网卡
  tproxy-port: 12345         # 内部配合的 TProxy 端口
  auto-direct-offload: true  # 开启内核直连卸载！

  # 局域网管理：默认放行路由器本身的 SSH 22、DHCP 等
  lan:
    bypass-src-ports:
      - 22
      - 67
      - 68
      - 5353

  # 软路由宿主机本机不代理，仅作为局域网网关转发
  host:
    # 是否代理路由器/网关本机发出的网络流量
    proxy-local: false
    # 仅代理的路由器进程白名单（留空则代理全部未放行进程）
    proxy-processes: []
    # 直连放行的路由器进程黑名单（如某些特定守护进程,）
    bypass-processes: []
  # 访问目标端配置 (Target)
  target:
    # 直连放行的目标端口（如 NTP: 123 等）
    bypass-dst-ports: []
    # 仅代理的目标端口（可填常用端口列表或 0-65535）
    proxy-dst-ports:
      - 21
      - 22
      - 80
      - 443
      - 8080
      - 8443
    # 直连放行的目标 IP / 保留地址网段（回环、私网、组播地址等）
    # 注意：这里一定要放行你的内网局域网段
    bypass-dst-ips:
      - 127.0.0.0/8
      - 169.254.0.0/16
      - 192.168.0.0/16
      - 224.0.0.0/4
      - ::1/128
      - fe80::/10
      - ff00::/8
      - "rule-set:private"
    # 仅代理的目标 IP / CIDR 网段（留空表示代理除 bypass 外的所有目标）
    proxy-dst-ips: []
# 配合更灵活的 DNS2 或传统 DNS
dns:
  enable: true
  listen: 0.0.0.0:53         # 直接作为局域网的 DNS 服务器
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  nameserver:
    - 223.5.5.5
    - 119.29.29.29
  fallback:
    - https://1.1.1.1/dns-query

# 规则提供者（按需引入分割好的 mrs 规则，避免全量 geodata）
rule-providers:
  cn-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/cn.mrs"
    path: ./rules/cn-domain.mrs
    interval: 86400
  cn-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/cn_ip.mrs"
    path: ./rules/cn-ip.mrs
    interval: 86400
  private:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/cn_ip.mrs"
    path: ./rules/private.mrs
    interval: 86400
# 节点与策略组根据实际情况引入
proxies: []
proxy-groups:
  - name: PROXY
    type: select
    proxies: [DIRECT]

rules:
  - RULE-SET,cn-domain,DIRECT
  - RULE-SET,cn-ip,DIRECT,no-resolve
  - MATCH,PROXY
```

---

## 方案二：全平台 TUN 虚拟网卡模式

适用于 macOS / Windows / Linux 各类需要整机流量完全接管的设备。

### 实战配置 (`config.yaml`)

```yaml
mode: rule
log-level: info
allow-lan: true
bind-address: "*"

# 开启 TUN 虚拟网卡
tun:
  enable: true
  stack: system               # 使用系统原生高效协议栈
  device: "utun1989"          # macOS 为 utun，Linux 可设为 dev://tun0
  auto-route: true            # 自动接管默认路由
  auto-detect-interface: true # 自动探测物理出口网卡
  dns-hijack:
    - "0.0.0.0:53"            # 劫持所有 53 端口 DNS 请求
  strict-route: true          # 防止路由泄漏

# 开启域名嗅探
sniffer:
  enable: true
  force-dns-mapping: true

# 本地 DNS 引擎
dns:
  enable: true
  listen: 127.0.0.1:1053
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  nameserver:
    - 223.5.5.5
    - 119.29.29.29
  fallback:
    - https://1.1.1.1/dns-query

# 规则提供者（按需引入分割好的 mrs 规则，避免全量 geodata）
rule-providers:
  cn-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/cn.mrs"
    path: ./rules/cn-domain.mrs
    interval: 86400
  cn-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/cn_ip.mrs"
    path: ./rules/cn-ip.mrs
    interval: 86400

proxies: []
proxy-groups:
  - name: PROXY
    type: select
    proxies: [DIRECT]

rules:
  - RULE-SET,cn-domain,DIRECT
  - RULE-SET,cn-ip,DIRECT,no-resolve
  - MATCH,PROXY
```

---

## 旁路由网络参数设置提示

将软路由设为旁路网关后，若希望局域网内的其它终端设备（如 iPhone、PC、智能电视）受其分流控制：

1. 将终端设备的 **IP 地址** 保持与局域网同网段（如 `192.168.1.105`）。
2. 将终端设备的 **路由器 / 网关 (Gateway)** 指向运行 `clash-rs` 的软路由 IP（如 `192.168.1.2`）。
3. 将终端设备的 **DNS 服务器** 同样指向该软路由 IP（如 `192.168.1.2`）。
4. 在 Linux 软路由上确认开启了系统 IPv4 转发：
   ```bash
   sysctl -w net.ipv4.ip_forward=1
   ```
