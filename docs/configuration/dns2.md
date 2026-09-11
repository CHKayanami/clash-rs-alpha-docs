# 更灵活的DNS (DNS2) ⚡

`dns2` 是 `clash-rs` 创新设计的高性能更灵活的 DNS 路由子系统。它彻底颠覆了传统 Clash 粗粒度的并发回退模型，引入了**标签化上游端点池 (Upstream Pool)**、**代理穿透解析 (Detour)**、**独立 Fake-IP 端点**以及**请求 (Request) 与响应 (Response) 双阶段路由规则引擎**。

::: tip 优先级声明
在 `config.yaml` 中，`dns:` 与 `dns2:` 相互独立。当同时声明且 `dns2.enable: true` 时，**`dns2` 拥有更高优先级**，将完全接管本地与核心的所有域名解析请求。
:::

---

## 完整配置速查示例

```yaml
dns2:
  enable: true
  ipv6: false
  use-hosts: true

  # 监听端点（支持同时监听 UDP/TCP/DoT/DoH）
  listen:
    udp: 127.0.0.1:1053
    tcp: 127.0.0.1:1053

  # 引导与出站专用 DNS
  default-nameserver:
    - 223.5.5.5
    - 119.29.29.29
  proxy-server-nameserver:
    - 119.29.29.29
    - 223.5.5.5

  # ── 缓存控制与 RFC 8767 Serve-Stale 优化 ──────────────────────────────────
  # 乐观 DNS 缓存保底最小 TTL（秒，0 = 遵循上游原始 TTL，>0 则为最小保底 TTL）
  optimistic-cache-ttl: 300

  # 过期缓存保留时长（秒，默认 3600 秒）。用于在网络故障或上游异常时触发 Serve-Stale 备灾降级并后台无感刷新
  stale-cache-retention: 3600

  # 全局受控 LRU 缓存与反向 IP 查找缓存容量上限（默认 4096 条目，别名: cache-size）
  cache-capacity: 4096

  # ── 上游端点定义 (Upstreams) ────────────────────────────────────────────────
  upstreams:
    - tag: direct-dns
      type: remote
      server:
        - 223.5.5.5
        - 119.29.29.29
        - https://dns.alidns.com/dns-query

    - tag: proxy-dns
      type: remote
      server:
        - https://1.1.1.1/dns-query
        - tls://8.8.8.8:853
      proxy: PROXY                  # 绑定的出站代理节点或策略组名称 (detour)

    - tag: local-dns
      type: local                   # 本机系统 libc 解析器

    - tag: fakeip-dns
      type: fakeip
      inet4-range: 198.18.0.1/16
      inet6-range: fc00::/18
      ttl: 1                        # 响应记录固定 TTL（秒）

  # ── DNS 路由规则系统 (Routing) ──────────────────────────────────────────────
  routing:
    # ── 阶段一：Request 路由规则 ──────────────────────────────────────────────
    request:
      # 拦截广告与恶意域名
      - rule-set:
          - adblock
        action: reject
        reject-code: nxdomain

      # 国内域名直连解析（引用 rule-providers 中引入的 cn.mrs 规则集）
      - rule-set:
          - cn-domain
        domain:
          - "+.baidu.com"
          - "+.qq.com"
        upstream: direct-dns

      # 走代理的境外域名分发至 Fake-IP 池（引用 mrs 境外代理规则集）
      - rule-set:
          - proxy-domain
        domain:
          - "+.google.com"
          - "+.github.com"
        upstream: fakeip-dns

      # 未匹配规则时的兜底分发
      - fallback: direct-dns

    # ── 阶段二：Response 路由规则 ─────────────────────────────────────────────
    response:
      # 防投毒重查：若直连 DNS 返回的 IP 命中常见污染网段，立即转向海外清洁 DNS 重查
      - from-upstream: direct-dns
        ip-cidr:
          - 240.0.0.0/4
          - 127.0.0.0/8
          - 0.0.0.0/8
        action: requery
        upstream: proxy-dns

      # 防污染 IP 规则集校验：若直连 DNS 应答命中特定异常 IP 规则集，触发重查
      - from-upstream: direct-dns
        rule-set:
          - proxy-ip-set
        upstream: proxy-dns
```

---

## 顶层字段规格表 (`dns2:`)

| 配置字段 | 类型 | 是否必填 | 默认值 | 详细说明与取值 |
| :--- | :--- | :--- | :--- | :--- |
| **`enable`** | 布尔值 | **必填** (若使用 DNS2) | `false` | 是否启用更灵活的 DNS (DNS2) 子系统。开启后完全接管传统 `dns:`。 |
| **`ipv6`** | 布尔值 | 可选 | `false` | 是否解析并返回 IPv6 (AAAA) 记录。若设为 `false`，遇到 AAAA 查询立即返回空结果。 |
| **`use-hosts`** | 布尔值 | 可选 | `true` | 是否优先查找本地 `hosts` 映射表（内存零网络开销直出）。 |
| **`hosts`** | 映射 (`域名: IP/列表`) | 可选 | `{}` | 静态自定义 Hosts 映射，支持单一 IP 或 IP 列表。 |
| **`hosts-files`** | 字符串列表 | 可选 | `[]` | 外部 hosts 文件路径列表（如 `["/etc/hosts", "./ad-hosts.txt"]`）。 |
| **`default-nameserver`** | 字符串列表 | 可选 | `[]` | 引导 DNS (Bootstrap)，专用于解析各 upstream 的 DoH/DoT 域名，**必须填纯 IP**。 |
| **`proxy-server-nameserver`** | 字符串列表 | 可选 | `[]` | 专用于直连解析代理节点出站服务器域名的 DNS 列表。 |
| **`optimistic-cache-ttl`** | 整数 (秒) | 可选 | `0` | **乐观 DNS 缓存保底最小 TTL**。若设为 `0` 则遵循上游原始 TTL；若 `> 0` 则为最小保底寿命，并自动重写响应记录 TTL。 |
| **`stale-cache-retention`**| 整数 (秒) | 可选 | `3600` | **RFC 8767 Serve-Stale 过期缓存保留时长**。在上游网络异常或超时时返回过期旧记录并异步后台刷新。 |
| **`cache-capacity`** | 整数 (条目数) | 可选 | `4096` | 全局受控 LRU 缓存与反向 IP 查找缓存容量上限（别名: `cache-size`，最小为 1）。 |
| **`upstreams`** | 对象列表 | **必填** (若使用 DNS2) | `[]` | 标签化上游端点池列表，详见下文端点规范。 |
| **`routing`** | 复合对象 | **必填** (若使用 DNS2) | `{}` | 请求与响应双阶段路由规则引擎，详见下文路由规则规范。 |

---

## 上游端点池规格 (`upstreams:`)

每个端点支持配置以下属性：

| 字段 | 类型 | 是否必填 | 默认值 | 说明与枚举取值 |
| :--- | :--- | :--- | :--- | :--- |
| **`tag`** | 字符串 | **必填** | 无 | 该端点的唯一命名标识（在 `routing` 规则中通过此 tag 引用）。 |
| **`type`** | **枚举字符串** | **必填** | 无 | 端点类型枚举，可选值：<br>• **`remote`**：远程 DNS 服务器端点；<br>• **`local`**：本机系统 libc 原生解析器（`lookup_host`）；<br>• **`fakeip`**：独立 Fake-IP 虚拟 IP 分配池。 |
| **`server`** | 字符串或列表 | `remote` 必填 | 无 | DNS 服务器地址列表，支持纯 IP、`tls://`、`https://`。 |
| **`proxy`** | 字符串 | 可选 | 无 (直连) | **出站代理穿透 (Detour)**。指定代理节点或策略组名称，该端点发出的所有 DNS 解析网络包均穿透此代理发出。 |
| **`client_subnet`** | 字符串 (CIDR) | 可选 | 无 | 携带的 EDNS Client Subnet 客户端 IP 掩码（如 `114.114.114.114/24`）。 |
| **`inet4-range`** | 字符串 (CIDR) | 可选 | `"198.18.0.1/16"` | （仅 `fakeip` 类型有效）IPv4 Fake-IP 保留虚拟网段。 |
| **`inet6-range`** | 字符串 (CIDR) | 可选 | `"fc00::/18"` | （仅 `fakeip` 类型有效）IPv6 Fake-IP 保留虚拟网段。 |
| **`ttl`** | 整数 (秒) | 可选 | 无 (Follow 上游/FakeIP 1s) | 强制重写该端点应答记录的 TTL（秒）。 |

---

## 路由规则引擎规格 (`routing:`)

### 1. Request 阶段规则 (`routing.request`)
在收到 DNS 查询请求的第一刻自上而下匹配：

| 字段 | 类型 | 是否必填 | 默认值 | 说明与枚举取值 |
| :--- | :--- | :--- | :--- | :--- |
| **`domain`** | 字符串列表 | 可选 | `[]` | 域名匹配列表，支持 `+.google.com`、`*.lan`。 |
| **`rule-set`** | 字符串列表 | 可选 | `[]` | 引用的外部规则集提供者名称（由 `rule-providers` 声明）。 |
| **`query-type`** | 字符串列表 | 可选 | `[]` | DNS 查询记录类型，如 `["A", "AAAA", "TXT", "HTTPS"]`。 |
| **`source-ip-cidr`** | 字符串列表 | 可选 | `[]` | 发起 DNS 查询的客户端源 IP / CIDR 网段。 |
| **`invert`** | 布尔值 | 可选 | `false` | 是否反转判定匹配结果（取反）。 |
| **`upstream`** | 字符串 | 可选 (不拦截时必填) | 无 | 命中时分发的目标 upstream 端点 `tag`。 |
| **`action`** | **枚举字符串** | 可选 | 无 | 执行动作。可选值：<br>• **`reject`**：直接阻断拦截当前请求，不向上游转发。 |
| **`reject-code`** | **枚举字符串** | 可选 | `nxdomain` | 当 `action: reject` 时返回的 DNS 状态码，可选值：<br>• **`nxdomain`**：返回“无此域名”；<br>• **`nodata`**：返回“成功但无对应数据记录”。 |
| **`fallback`** | 字符串 | 可选 | 无 | 当未命中本规则或指定上游不可用时的兜底 upstream `tag`。 |

---

### 2. Response 阶段规则 (`routing.response`)
在上游解析返回真实 IP 后的深度防污染与内容校验引擎：

| 字段 | 类型 | 是否必填 | 默认值 | 说明与枚举取值 |
| :--- | :--- | :--- | :--- | :--- |
| **`from-upstream`** | 字符串 | 可选 | 无 (所有上游) | 仅对来自特定 upstream `tag` 返回的应答包生效（例如只校验 `direct-dns`）。 |
| **`ip-cidr`** | 字符串列表 | 可选 | `[]` | 检查应答包中包含的真实结果 IP 是否命中了这些网段（常用于拦截运营商投毒保留段）。 |
| **`rule-set`** | 字符串列表 | 可选 | `[]` | 检查应答包中的 IP 是否命中了特定 IP 规则集（如 `proxy-ip-set`）。 |
| **`domain`** | 字符串列表 | 可选 | `[]` | 关联校验的域名列表。 |
| **`query-type`** | 字符串列表 | 可选 | `[]` | 关联校验的查询记录类型。 |
| **`action`** | **枚举字符串** | 可选 | `accept` | 命中时的动作，可选值：<br>• **`requery`**：**触发防污染重查**，核心自动发起二次查询；<br>• **`accept`**：接受并返回当前解析结果。 |
| **`upstream`** | 字符串 | `action: requery` 时必填 | 无 | 触发重查时所使用的清洁 upstream `tag`（通常填 `proxy-dns`）。核心会自动限制仅重查 1 次，杜绝死循环。 |
| **`invert`** | 布尔值 | 可选 | `false` | 是否反转判定条件。 |

---

## 缓存控制与 RFC 8767 深度优化

`dns2` 子系统内置了极具前瞻性的高性能受控缓存控制策略：

### 1. 乐观缓存保底 (`optimistic-cache-ttl`)
- 国内诸多云厂商或 CDN 节点为避免绑定过久，往往返回低至 5 秒至 15 秒的 TTL，导致终端设备频繁发起重复的网络解析。
- 设置 `optimistic-cache-ttl: 300` 后，核心会自动判断：**当上游原始 TTL 或端点 override-ttl 低于该值时，自动将保底寿命延长至 300 秒，并在返回客户端的数据包中实时重写响应 TTL**。这大幅降低了重复解析延迟与带宽占用。

### 2. RFC 8767 Serve-Stale 优雅降级与后台异步刷新
- 当上游 DNS 由于网络抖动、海外线路中断或暂时宕机时，若缓存记录已过期，只要在 `stale-cache-retention`（默认 3600 秒）窗口期内，核心会**优先秒回过期的旧记录**，保障本地网页和应用的连通不断流；
- 与此同时，核心会在后台利用 Singleflight 机制并发合并，无感地发起异步刷新；一旦新响应到达，立即替换旧缓存。

### 3. 缓存安全性与抗污染保护机制
- **ACME 证书保护**：对于 `_acme-challenge.` 前缀的 TXT 证书申请解析记录，核心自动杜绝缓存，防止由于 DNS 缓存导致 Let's Encrypt 等自动化证书申请验证失败。
- **全零/未指定 IP 过滤**：对于解析结果全为未指定 IP（如 `0.0.0.0` 或 `::`）的异常响应，自动跳过缓存写入，防止被临时错误阻断污染缓存池。
- **容量上限控制 (`cache-capacity`)**：全局受控 LRU 结构（默认容量 `4096` 条），超限时基于最近最少使用算法淘汰旧记录，确保长时间运行内存占用恒定平稳。
