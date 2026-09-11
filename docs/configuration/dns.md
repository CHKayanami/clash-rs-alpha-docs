# 传统 DNS 引擎 (DNS)

`clash-rs` 内置了功能完备的高性能防污染 DNS 服务器。它既可以作为本地系统或局域网的独立 DNS 服务（支持 UDP、TCP、DoT、DoH、DoH3），也负责核心内部出站连接的域名解析与 Fake-IP 虚拟映射管理。

::: tip 寻找更灵活的规则路由 DNS？
如果你需要基于标签的多上游端点池、请求/响应双阶段规则路由、细粒度重查 (Requery) 防污染，推荐参阅专属的 [更灵活的DNS手册](/configuration/dns2)。
:::

---

## 完整配置速查全貌

```yaml
dns:
  enable: true
  ipv6: false
  use-hosts: true

  # ── 1. 本地 DNS 监听服务 (支持单端口与多协议复合监听) ──────────────────────
  listen:
    udp: 0.0.0.0:1053
    tcp: 0.0.0.0:1053
    dot:
      addr: 0.0.0.0:853
      ca-cert: ./certs/dns.crt
      ca-key: ./certs/dns.key
    doh:
      addr: 0.0.0.0:8443
      ca-cert: ./certs/dns.crt
      ca-key: ./certs/dns.key
      hostname: dns.clash.local
    doh3:
      addr: 0.0.0.0:8443
      ca-cert: ./certs/dns.crt
      ca-key: ./certs/dns.key
      hostname: dns.clash.local

  # ── 2. 增强解析模式与 Fake-IP 双栈 ─────────────────────────────────────────
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  fake-ip-range6: fc00::/18
  fake-ip-ttl: 1
  fake-ip-filter-mode: blacklist

  fake-ip-filter:
    - "*.lan"
    - "localhost.ptlogin2.qq.com"
    - "+.msftconnecttest.com"
    - "+.msftncsi.com"
    - "rule-set:direct-domains"

  black-filter:
    - "*.ads.example.com"

  # ── 3. 引导与专用服务器 ────────────────────────────────────────────────────
  default-nameserver:
    - 114.114.114.114
    - 223.5.5.5
    - 8.8.8.8

  proxy-server-nameserver:
    - 119.29.29.29
    - 223.5.5.5
    - tls://1.1.1.1:853#proxy=PROXY

  # ── 4. 主解析服务器与 URL Fragment 参数 ────────────────────────────────────
  nameserver:
    - 223.5.5.5
    - 119.29.29.29
    - tls://1.1.1.1:853
    - https://dns.alidns.com/dns-query
    - https://8.8.8.8/dns-query#proxy=PROXY
    - tls://1.1.1.1:853#interface=eth0
    - 8.8.8.8#interface=eth0&proxy=PROXY

  # ── 5. 并发备用服务器与防污染回退过滤 (Fallback) ───────────────────────────
  fallback:
    - tls://8.8.8.8:853
    - https://1.1.1.1/dns-query
    - https://cloudflare-dns.com/dns-query#PROXY

  fallback-filter:
    geoip: true
    geoip-code: CN
    ipcidr:
      - 240.0.0.0/4
      - 0.0.0.0/8
      - 127.0.0.0/8
    domain:
      - "+.google.com"
      - "+.facebook.com"
      - "+.youtube.com"

  # ── 6. 域名策略路由 (Nameserver Policy) ────────────────────────────────────
  nameserver-policy:
    # 推荐使用 rule-set 引用通过 rule-providers 引入的轻量 mrs 规则集
    "rule-set:cn-domain":
      - 223.5.5.5
      - 119.29.29.29
    "rule-set:proxy-domain":
      - https://1.1.1.1/dns-query#PROXY
    "+.internal.corp.com": 10.0.0.1
    # 兼容语法（若配置了全量 geosite.dat）："geosite:cn": [223.5.5.5]

  # ── 7. 高级分流与 EDNS Client Subnet ────────────────────────────────────────
  respect-rules: false

  edns-client-subnet:
    ipv4: 1.2.3.0/24
    ipv6: 2001:db8::/56

  # ── 8. 缓存控制与 RFC 8767 Serve-Stale 优化 ────────────────────────────────
  optimistic-cache-ttl: 300
  fixed-domain-ttl:
    "*.api.example.com": 60
    "dyn.ddns.org": 0
  stale-cache-retention: 3600
  qtype-filter:
    - HTTPS
```

---

## 字段规格全览表 (必填性 / 默认值 / 类型)

| 配置字段 | 类型 | 是否必填 | 默认值 | 说明与取值 |
| :--- | :--- | :--- | :--- | :--- |
| **`enable`** | 布尔值 | **必填** (若使用 DNS) | `false` | 是否启用内置 DNS 服务。设为 `false` 时将直接使用操作系统默认的系统 DNS。 |
| **`ipv6`** | 布尔值 | 可选 | `false` | 是否开启 IPv6 解析应答。若设为 `false`，遇到 AAAA 查询时直接返回空结果。 |
| **`use-hosts`** | 布尔值 | 可选 | `true` | 是否在域名查询时优先查找全局配置中的 `hosts:` 静态映射表。 |
| **`listen`** | 字符串 或 复合对象 | 可选 | 无 (不开启外部服务) | DNS 服务端监听端口。可简写为 `"127.0.0.1:53"`，或配置字典同时开启 `udp`、`tcp`、`dot`、`doh`、`doh3`。 |
| **`enhanced-mode`** | **枚举字符串** | 可选 | `normal` | **DNS 增强解析模式**。详见下方枚举清单。 |
| **`fake-ip-range`** | 字符串 (CIDR) | 可选 | `"198.18.0.1/16"` | IPv4 Fake-IP 保留虚拟分配网段。 |
| **`fake-ip-range6`** | 字符串 (CIDR) | 可选 | `"fc00::/18"` | IPv6 Fake-IP 保留虚拟分配网段 (ULA 地址段)。 |
| **`fake-ip-ttl`** | 整数 (秒) | 可选 | `1` | 返回给客户端的 Fake-IP DNS 应答 TTL。默认 1 秒，防止客户端持久缓存导致切节点断流。 |
| **`fake-ip-filter-mode`** | **枚举字符串** | 可选 | `blacklist` | **Fake-IP 过滤模式**。详见下方枚举清单。 |
| **`fake-ip-filter`** | 字符串列表 | 可选 | `[]` | 命中过滤判定的域名列表。支持完整域名、通配符 (`*.lan`, `+.domain.com`) 或规则集引用 (`rule-set:name`)。 |
| **`black-filter`** | 字符串列表 | 可选 | `[]` | DNS 阻断黑名单。命中这些域名的查询直接丢弃/拒绝，不向上游发起任何网络请求。 |
| **`default-nameserver`** | 字符串列表 | 可选 | `["114.114.114.114", "8.8.8.8"]` | **引导 DNS (Bootstrap)**。仅用于解析其他 DoH/DoT 服务器的域名，**必须填纯 IP**。 |
| **`proxy-server-nameserver`**| 字符串列表 | 可选 | `[]` | **节点服务器专属 DNS**。专门用于解析代理节点服务器自身域名的直连 DNS，支持 `#proxy=` 锚点。 |
| **`nameserver`** | 字符串列表 | **必填** (若启用 DNS) | `[]` | **核心主解析 DNS 服务器列表**。支持 UDP、TCP、DoT、DoH 以及 URL 锚点参数。 |
| **`fallback`** | 字符串列表 | 可选 | `[]` | **备用/境外防污染 DNS 服务器列表**。与 `nameserver` 并发请求，供 `fallback-filter` 筛选。 |
| **`fallback-filter`** | 复合对象 | 可选 | 见下文 | 控制何时抛弃 `nameserver` 结果并采用 `fallback` 结果的判定过滤器。 |
| **`nameserver-policy`** | 映射 (键值对) | 可选 | `{}` | 精细化指定特定域名走向专属 DNS 服务器，支持 `geosite:cn`、`rule-set:name` 或域名匹配。 |
| **`respect-rules`** | 布尔值 | 可选 | `false` | 上游 DNS 查询是否经由核心分流规则调度。若为 `true`，DNS 上游请求也将匹配 `rules` 走向指定节点。 |
| **`edns-client-subnet`** | 复合对象 | 可选 | 无 | 向上游 DNS 查询携带客户端子网 (ECS)，支持 `ipv4: <CIDR>` 和 `ipv6: <CIDR>`。 |
| **`optimistic-cache-ttl`** | 整数 (秒) | 可选 | `0` | **乐观缓存最小 TTL**。若大于 0，核心将强制把低于此值的上游 TTL 延长到该时长，减少请求频次。设为 `0` 完全遵从上游。 |
| **`fixed-domain-ttl`** | 映射 (`域名: 秒`) | 可选 | `{}` | 针对特定域名的固定 TTL 重写。将某域名设为 `0` 表示针对该域名永不缓存。 |
| **`stale-cache-retention`** | 整数 (秒) | 可选 | `3600` | **RFC 8767 Serve-Stale 过期缓存保留时长**。在上游发生网络抖动或超时期间，临时返回过期旧缓存保障可用性。 |
| **`qtype-filter`** | 字符串列表 | 可选 | `[]` | DNS 查询记录类型拦截列表（如 `["HTTPS", "AAAA"]`）。拦截的记录类型直接返回 `NODATA`，不转发上游。 |

---

## 枚举类配置可选项全集

### 1. `enhanced-mode` (DNS 模式)

| 可选枚举值 | 说明 |
| :--- | :--- |
| **`normal`** (默认值) | **常规解析模式**。本地向上游发起真实 DNS 查询，解析出真实 IP 后返回给客户端。 |
| **`fake-ip`** (强烈推荐) | **虚拟保留 IP 模式**。收到域名查询立即从 `fake-ip-range` 池中分配一个虚拟 IP 秒回客户端，同时在核心内部建立映射表。后续客户端发起 TCP/UDP 连接时由核心还原出真实域名，直接交由远端代理节点解析，完全免疫本地 DNS 污染且速度最快。 |
| **`redir-host`** | **已废弃模式**。返回本地环回地址并在内部还原，兼容性较差，强烈建议改用 `fake-ip`。 |

### 2. `fake-ip-filter-mode` (Fake-IP 过滤模式)

| 可选枚举值 | 说明 |
| :--- | :--- |
| **`blacklist`** (默认值) | **黑名单模式**。凡是在 `fake-ip-filter` 列表中的域名**绕过 Fake-IP**（返回真实物理解析 IP）；其余所有域名均返回 Fake-IP。 |
| **`whitelist`** | **白名单模式**。**仅有**在 `fake-ip-filter` 列表中的域名才会返回 Fake-IP；其余未列出的域名一律走本地上游解析真实物理 IP。 |

---

## `fallback-filter` 判定参数详解

当配置了 `fallback` 时，核心会同时向上游 `nameserver` 与 `fallback` 发起并发查询。当 `nameserver` 返回的结果命中以下任意一项时，将抛弃该结果，改用安全清洁的 `fallback` 解析结果：

```yaml
fallback-filter:
  geoip: true                       # 可选，默认: true。当解析结果 IP 的 GeoIP 国家代码不等于 geoip-code 时触发回退
  geoip-code: CN                    # 可选，默认: "CN"。预期的归属国代码
  ipcidr:                           # 可选，默认: []。若 nameserver 返回的 IP 命中这些网段（如运营商投毒保留段），强制回退
    - 240.0.0.0/4
    - 0.0.0.0/8
    - 127.0.0.0/8
  domain:                           # 可选，默认: []。指定域名无条件直接采用 fallback 服务器结果
    - "+.google.com"
    - "+.facebook.com"
```

---

## 上游服务器 URL 协议与 Fragment 锚点参数

在 `nameserver`、`fallback`、`proxy-server-nameserver` 中，每个上游条目支持丰富的格式与控制参数：

### 支持的协议前缀
- `223.5.5.5` 或 `udp://223.5.5.5:53`：标准 UDP 传输；
- `tcp://1.1.1.1:53`：强制通过标准 TCP 传输；
- `tls://dns.google:853`：DNS over TLS (DoT)；
- `https://dns.alidns.com/dns-query`：DNS over HTTPS (DoH)；
- `dhcp://en0`：自动使用特定网卡通过局域网 DHCP 获取的 DNS。

### 支持的 `#` 锚点控制参数（多参数用 `&` 连接）
- **`#proxy=<代理节点/策略组名>`**（或简写为 `#<节点名>`）：强制将该 DNS 请求穿透指定的出站代理节点发往远端；
- **`#interface=<物理网卡名>`**：强制将该 DNS 请求绑定在指定网卡接口发出（`SO_BINDTODEVICE`）。
- **示例**：`https://8.8.8.8/dns-query#interface=eth0&proxy=PROXY`。
