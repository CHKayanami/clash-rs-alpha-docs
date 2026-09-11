# 极简常用分流配置

本配置是一份适合个人桌面端或服务器日常使用的高可用精简模板，采用 `mixed-port` 单端口，结合 DNS Fake-IP 与基础国内直连规则，兼顾性能与纯净。

---

## 配置文件内容 (`config.yaml`)

```yaml
# ── 1. 基础入站与核心参数 ─────────────────────────────────────────────────────
mixed-port: 7890              # HTTP 与 SOCKS5 混合代理入站端口
tproxy-port: 7892             # TProxy 透明代理端口（常用于 Linux 软路由 iptables/nftables 透明转发）
allow-lan: true               # 允许局域网内其他设备接入当前代理服务
mode: Rule                    # 运行模式：Rule（规则分流）| Global（全局代理）| Direct（全直连）
log-level: error              # 日志输出级别：error | warning | info | debug | silent
ipv6: true                    # 开启 IPv6 入站与分流支持
find-process-mode: "off"      # 进程名称查找模式：off | always | strict（关闭可显著降低 CPU 开销）
routing-mark: 7894            # Linux 系统出站 SO_MARK 标记，避免 TProxy 本机回环流量陷入死循环

# ── 2. 外部控制器与内置 Web 面板 ─────────────────────────────────────────────
external-controller: 0.0.0.0:9999 # 外部 RESTful API 监听地址（访问 http://IP:9999/ui/ 可直达官方内置面板）
cors-allow-origins:
  - "*"                       # 允许来自所有源的跨域请求，便于第三方 Dashboard 接入
secret: "123456"              # Web 控制器访问鉴权密码（建议修改为自己的强密码）

# ── 3. 本地高性能 DNS 引擎 ───────────────────────────────────────────────────
dns:
  enable: true                # 启用内置 DNS 服务
  listen: "[::]:1053"         # DNS 服务监听地址（支持 IPv4/IPv6 双栈）
  use-hosts: true             # 优先查询下方静态 hosts 映射表
  ipv6: true                  # 允许解析并返回 IPv6 (AAAA) 记录
  default-nameserver:
    - system                  # Bootstrap 引导 DNS，使用系统 libc 解析后续 DoH/DoT 域名
  enhanced-mode: fake-ip      # DNS 运行模式：fake-ip（秒回虚拟保留 IP，规避污染且速度最快）
  fake-ip-range: 198.18.0.1/16 # IPv4 Fake-IP 虚拟地址池
  fake-ip-range6: fc00::/18   # IPv6 Fake-IP 虚拟地址池

  # 绕过 Fake-IP 解析真实 IP 的规则集（国内域名与苹果直连服务不虚拟化）
  fake-ip-filter:
    - "rule-set:geosite-cn"
    - "rule-set:apple-cn"

  # DNS 黑名单过滤规则集（命中直接返回 NODATA，阻断广告与追踪器解析）
  black-filter: 
    - "rule-set:ads"

  # 核心主解析 DNS 服务器列表
  nameserver:
    - 223.5.5.5

# ── 4. 静态 Hosts 映射 ────────────────────────────────────────────────────────
hosts:
  'time.android.com': 203.107.6.88   # 阿里 NTP 对时服务器
  'time.facebook.com': 203.107.6.88
  'localhost': 127.0.0.1

# ── 5. 代理节点集合 (Proxies) ────────────────────────────────────────────────
# 可在此填入手动自建节点，或后续通过 proxy-providers 订阅引入
proxies:
  # 示例 Shadowsocks 节点
  # - name: "香港 01"
  #   type: ss
  #   server: 1.2.3.4
  #   port: 8388
  #   cipher: 2022-blake3-aes-128-gcm
  #   password: "your-password"
  #   udp: true

# ── 6. 策略组集合 (Proxy Groups) ──────────────────────────────────────────────
# include-all: true 会自动汇入 proxies: 中的所有可用节点
proxy-groups:
  # 核心节点总控组
  - name: 🚀 节点选择
    type: select
    proxies:
      - ♻️ 自动选择
      - DIRECT
    include-all: true

  # 延迟自动优选组（定期测速并切换到最低延迟节点）
  - name: ♻️ 自动选择
    type: url-test
    url: http://www.gstatic.com/generate_204
    interval: 300             # 测速周期（秒）
    tolerance: 50             # 切换容差阈值（毫秒）
    proxies: []
    include-all: true

  # 国际流媒体专用策略组
  - name: 🌍 国外媒体
    type: select
    proxies:
      - 🚀 节点选择
      - ♻️ 自动选择
      - 🎯 全球直连
    include-all: true

  # Telegram 专用策略组
  - name: 📲 电报信息
    type: select
    proxies:
      - 🚀 节点选择
      - 🎯 全球直连
    include-all: true

  # 微软服务策略组（默认推荐直连）
  - name: Ⓜ️ 微软服务
    type: select
    proxies:
      - 🎯 全球直连
      - 🚀 节点选择
    include-all: true

  # YouTube 专用策略组
  - name: 📹 油管视频
    type: select
    proxies:
      - 🚀 节点选择
      - 🎯 全球直连
    include-all: true

  # 人工智能（ChatGPT / Claude / Gemini）专用策略组
  - name: AI
    type: select
    proxies:
      - 🚀 节点选择
      - 🎯 全球直连
    include-all: true

  # Google 旗下常规服务策略组
  - name: 🇬 谷歌服务
    type: select
    proxies:
      - 🚀 节点选择
      - 🎯 全球直连
    include-all: true

  # Apple 旗下服务策略组（国内 CDN 建议直连）
  - name: 🍎 苹果服务
    type: select
    proxies:
      - 🚀 节点选择
      - 🎯 全球直连
    include-all: true

  # 全球直连控制组
  - name: 🎯 全球直连
    type: select
    proxies:
      - DIRECT
      - 🚀 节点选择
      - ♻️ 自动选择

  # 恶意流量与审计拦截组
  - name: 🛑 全球拦截
    type: select
    proxies:
      - REJECT
      - DIRECT

  # 广告净化专用拦截组
  - name: 🍃 应用净化
    type: select
    proxies:
      - REJECT
      - DIRECT

  # 最终兜底漏网之鱼组
  - name: 🐟 漏网之鱼
    type: select
    proxies:
      - 🚀 节点选择
      - 🎯 全球直连
      - ♻️ 自动选择
    include-all: true

# ── 7. 分流规则系统 (Rules) ──────────────────────────────────────────────────
# 规则自上而下匹配，一旦命中立即执行相应动作
rules:
  # 阻断 QUIC (UDP 443)，强制网页和视频退回 TCP TLS，规避运营商 QoS 限速并提升播放稳定性
  - AND,((NETWORK,UDP),(DST-PORT,443)),REJECT

  # 广告拦截
  - RULE-SET,ads,🍃 应用净化

  # 特定分类服务精准调度
  - RULE-SET,microsoft-cn,Ⓜ️ 微软服务
  - RULE-SET,apple-cn,🍎 苹果服务
  - RULE-SET,ai,AI
  - RULE-SET,google-lite,🇬 谷歌服务
  - RULE-SET,youtube,📹 油管视频
  - RULE-SET,media,🌍 国外媒体

  # Telegram IP 段直分流（使用 no-resolve 防止发起额外 DNS 请求）
  - RULE-SET,telegramip,📲 电报信息,no-resolve

  # 最终全局兜底分流
  - MATCH,🐟 漏网之鱼

# ── 8. 规则集提供者 (Rule Providers，远程 MRS 二进制规则) ─────────────────────
# 规则源自：https://github.com/DustinWin/ruleset_geodata/releases#release-mihomo-ruleset
# 采用 MRS 高性能二进制格式，具备微秒级加载、内存零冗余、按需拉取等优势
rule-providers:
  # 广告拦截规则集
  ads:
    type: http
    behavior: domain
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/ads.mrs"
    path: ./rules/ads.mrs
    interval: 86400

  # 微软国内直连域名集
  microsoft-cn:
    type: http
    behavior: domain
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/microsoft-cn.mrs"
    path: ./rules/microsoft-cn.mrs
    interval: 86400

  # 苹果国内直连域名集
  apple-cn:
    type: http
    behavior: domain
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/apple-cn.mrs"
    path: ./rules/apple-cn.mrs
    interval: 86400

  # AI (ChatGPT / Claude / Gemini) 域名集
  ai:
    type: http
    behavior: domain
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/ai.mrs"
    path: ./rules/ai.mrs
    interval: 86400

  # Google 域名集
  google-lite:
    type: http
    behavior: domain
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/google-cn.mrs"
    path: ./rules/google-cn.mrs
    interval: 86400

  # YouTube 专用域名集
  youtube:
    type: http
    behavior: domain
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/youtube.mrs"
    path: ./rules/youtube.mrs
    interval: 86400

  # 国际主流流媒体域名集
  media:
    type: http
    behavior: domain
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/media.mrs"
    path: ./rules/media.mrs
    interval: 86400

  # Telegram 专用 IP-CIDR 段
  telegramip:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/telegramip.mrs"
    path: ./rules/telegramip.mrs
    interval: 86400

  # 国内常用直连域名集（用于 DNS fake-ip-filter 白名单）
  geosite-cn:
    type: http
    behavior: domain
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/cn.mrs"
    path: ./rules/cn.mrs
    interval: 86400
```
