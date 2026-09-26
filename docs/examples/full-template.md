# 全配置参考模板

本页面整理了 `clash-rs` 官方的全配置参考模板。该模板涵盖了所有支持的顶级字段与嵌套语法，可作为编写复杂配置时的权威速查字典。

::: warning 提示
此文件作为**语法参考手册**，包含大量占位符与示例参数，**请勿直接当作可用配置直接启动**，应根据自身实际节点和网络环境按需取舍。
:::

---

## 完整配置 YAML

```yaml
# clash-rs full reference configuration
# ======================================
# 官网仓库：https://github.com/CHKayanami/clash-rs

# ── 1. 基础入站端口 (Inbound Ports) ──────────────────────────────────────────
port: 7890              # HTTP 代理端口
socks-port: 7891        # SOCKS5 代理端口
mixed-port: 7892        # 混合端口 (HTTP + SOCKS5)
redir-port: 7893        # Linux 重定向透明代理端口
tproxy-port: 7894       # Linux TProxy 透明代理端口

# HTTP / SOCKS 认证 (格式: "用户:密码")
# authentication:
#   - "user1:pass1"
#   - "user2:pass2"

# ── 2. 网络绑定与模式 (Network & Run Mode) ────────────────────────────────────
allow-lan: false        # 是否接受来自局域网的连接
bind-address: "127.0.0.1" # 监听地址 ("*" 监听所有网卡)
mode: rule              # 模式：rule (规则) | global (全局) | direct (直连)
log-level: info         # 日志：trace | debug | info | warning | error | off
ipv6: false             # 是否开启 IPv6 解析应答
quic: true              # 是否放行 QUIC (UDP 443) 流量 (设为 false 将直接阻断强制降级回退至 TCP)

# ── 3. 外部控制器 (RESTful API & Web UI) ──────────────────────────────────────
external-controller: 127.0.0.1:9090
# external-controller-unix: /tmp/clash-rs.sock
external-ui: public
external-ui-url: "https://github.com/MetaCubeX/metacubexd/archive/refs/heads/gh-pages.zip"
secret: ""
cors-allow-origins:
  - "*"

# ── 4. 路由标记与硬件接口 ────────────────────────────────────────────────────
# interface: eth0
# routing-mark: 6666

# ── 5. 地理数据库与规则集 (推荐按需引入 mrs 规则集，不推荐全量 dat) ───────────────
# 本项目强烈建议通过 rule-providers 按需引入分割好的 mrs 规则，避免加载数十 MB 的全量文件：
# 获取地址：https://github.com/DustinWin/ruleset_geodata/releases#release-mihomo-ruleset
# mmdb: Country.mmdb
# asn-mmdb: Country-asn.mmdb
# geosite: geosite.dat

# ── 6. 状态持久化 (Profile) ───────────────────────────────────────────────────
profile:
  store-selected: true
  store-fake-ip: false
  store-smart-stats: true

# ── 7. 静态 Hosts ─────────────────────────────────────────────────────────────
hosts:
  # "router.lan": 192.168.1.1
  # "+.local": 127.0.0.1

# ── 8. 域名嗅探 (Domain Sniffer) ──────────────────────────────────────────────
sniffer:
  enable: true
  force-dns-mapping: true
  parse-pure-ip: true
  override-destination: false
  sniff:
    TLS:
      ports: [443, 8443]
    HTTP:
      ports: [80, "8080-8880"]
      override-destination: true
    QUIC:
      ports: [443]
  skip-domain:
    - "+.apple.com"

# ── 9. TUN 虚拟网卡 (TUN Mode) ────────────────────────────────────────────────
tun:
  enable: false
  stack: system
  device: "utun1989"
  inet4-address: "198.18.0.1/16"
  inet6-address: "fd00:fac::1/64"
  auto-route: true
  auto-detect-interface: true
  strict-route: true
  dns-hijack:
    - "0.0.0.0:53"

# ── 10. eBPF 内核透明代理 (Linux Only) ────────────────────────────────────────
ebpf:
  enable: false
  lan-interface: ["auto"]
  wan-interface: "auto"
  tproxy-port: 12345
  auto-direct-offload: true
  lan:
    bypass-src-ports: [22, 67, 68, 5353]
    # 局域网客户端源 MAC 白名单过滤（若配置，仅拦截指定 MAC 设备的流量走代理，其余直连，上限 1024 条）
    # proxy-src-macs:
    #   - "00:11:22:33:44:55"
    #   - "aa:bb:cc:dd:ee:ff"
  target:
    bypass-dst-ports: [123, 500, 4500]
  host:
    proxy-local: false

# ── 11. 传统 DNS 引擎 ────────────────────────────────────────────────────────
dns:
  enable: true
  listen: 127.0.0.1:1053
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  default-nameserver:
    - 223.5.5.5
  nameserver:
    - 223.5.5.5
    - 119.29.29.29
  fallback:
    - https://1.1.1.1/dns-query

# ── 12. 更灵活的 DNS2 路由引擎 ⚡ (启用时优先于 dns:) ────────────────────────────
# dns2:
#   enable: true
#   # 缓存控制与 RFC 8767 Serve-Stale 优化
#   optimistic-cache-ttl: 300
#   stale-cache-retention: 3600
#   cache-capacity: 4096
#   upstreams:
#     - tag: direct-dns
#       type: remote
#       server: [223.5.5.5]
#     - tag: proxy-dns
#       type: remote
#       server: ["https://1.1.1.1/dns-query"]
#       proxy: PROXY
#     - tag: fakeip-dns
#       type: fakeip
#   routing:
#     request:
#       - rule-set: [cn-domain]
#         upstream: direct-dns
#       - rule-set: [proxy-domain]
#         upstream: fakeip-dns
#       - fallback: direct-dns

# ── 13. 显式 Listeners 监听器 ─────────────────────────────────────────────────
listeners:
  - name: mixed-in
    type: mixed
    listen: 127.0.0.1
    port: 7892
    udp: true

# ── 14. 代理节点集合 (Proxies) ────────────────────────────────────────────────
proxies:
  - name: "ss-node"
    type: ss
    server: 1.2.3.4
    port: 8388
    cipher: aes-256-gcm
    password: "password"
    udp: true

# ── 15. 策略组 (Proxy Groups) ─────────────────────────────────────────────────
proxy-groups:
  - name: "PROXY"
    type: select
    proxies:
      - "AUTO-BEST"
      - "ss-node"
      - DIRECT

  - name: "AUTO-BEST"
    type: url-test
    proxies:
      - "ss-node"
    url: "http://www.gstatic.com/generate_204"
    interval: 300

  - name: "HK-Auto"
    type: url-test
    include-all: true
    filter: "(?i)香港|HK|HongKong"
    empty-fallback: "DIRECT"
    url: "http://www.gstatic.com/generate_204"
    interval: 300

# ── 16. 规则提供者 (Rule Providers，推荐按需引入 mrs 格式) ───────────────────
# 规则源自：https://github.com/DustinWin/ruleset_geodata/releases#release-mihomo-ruleset
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

# ── 17. 分流规则 (Rules) ──────────────────────────────────────────────────────
rules:
  - DOMAIN-SUFFIX,google.com,PROXY
  - DOMAIN-KEYWORD,github,PROXY
  - AND,((DOMAIN,baidu.com),(NETWORK,UDP)),DIRECT
  - RULE-SET,cn-domain,DIRECT
  - RULE-SET,cn-ip,DIRECT,no-resolve
  - MATCH,PROXY
```
