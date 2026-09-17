# 策略组 (Proxy Groups)

策略组（Proxy Groups）是连接分流规则与出站节点的桥梁。它允许你将多个代理节点聚合在一起，实现手动切换、自动测速选优、故障主备容灾、多节点负载均衡或智能调度。

---

## 策略组类型枚举一览 (`type`)

`clash-rs` 支持以下 6 类策略组枚举类型：

| 策略组枚举类型 (`type`) | 调度工作方式 | 典型应用场景 |
| :--- | :--- | :--- |
| **`select`** | **手动选择**。在面板或 API 中手动指定当前生效的节点。 | 默认主代理组、区域节点手动备选 |
| **`url-test`** | **自动测速选优**。定时向健康检测 URL 发起 HTTP GET，自动切换到延迟最低的节点。 | 流媒体、高画质视频播放、网页极速浏览 |
| **`fallback`** | **故障主备容灾**。严格按节点列表先后顺序，优先使用排在第一位的健康节点，故障时顺位降级。 | 核心生产业务、外贸办公高可用保障 |
| **`load-balance`** | **负载均衡**。在多个节点间分摊流量连接（支持轮询、一致性哈希与黏性会话）。 | 多宽带聚合、大并发数据下载 |
| **`relay`** | **链式中继**。流量严格按顺序通过 A -> B -> C 逐层多重代理转发至目标。 | 隐藏真实出口 IP、链路嵌套中转 |
| **`smart`** | **自适应智能选择**。基于历史连接质量评分、站点黏性及带宽权重自适应决策。 | 追求全自动免维护的高级网络场景 |

---

## 策略组基础通用字段

无论哪种类型的策略组，均包含以下通用属性：

| 字段 | 类型 | 是否必填 | 默认值 | 详细说明与取值 |
| :--- | :--- | :--- | :--- | :--- |
| **`name`** | 字符串 | **必填** | 无 | 策略组的唯一名称（在 `rules` 中被规则引用）。 |
| **`type`** | **枚举字符串** | **必填** | 无 | 策略组类型，可选值见上方枚举清单。 |
| **`proxies`** | 字符串列表 | 条件必填 | `[]` | 显式包含的节点或子策略组名称列表。内置保留名包含 `DIRECT`（直连）与 `REJECT`（拦截）。当配置了 `use` 或 `include-all` 时本字段可省略。 |
| **`use`** | 字符串列表 | 可选 | `[]` | 动态引入的外部订阅提供者（[proxy-providers](/configuration/proxy-providers)）名称列表。其包含的所有可用节点将动态注入本组。 |
| **`include-all`** | 布尔值 | 可选 | `false` | 若设为 `true`，核心会自动将当前配置中定义的所有有效代理节点直接全部加入本组（排除 `DIRECT`/`REJECT` 与自身）。 |
| **`filter`** | 正则表达式 | 可选 | 无 | **节点名称正则过滤器**。用于从 `use` 引入的提供者节点或 `include-all` 节点中按名称精确筛选。基于 `fancy-regex` 引擎，支持大小写忽略标志（如 `(?i)`）及零宽断言（Lookaround）。 |
| **`empty-fallback`** | 字符串 | 可选 | 无 | **空节点安全兜底**。当组内节点因正则过滤无匹配或外部订阅为空导致可用节点为 0 时，自动回退到指定的兜底节点（如 `"DIRECT"`、`"REJECT"` 或特定节点名称），避免连接调度直接抛错。 |
| **`icon`** | 字符串 (URL) | 可选 | 无 | 在 Web 面板中展示的图标直链。 |

---

## 节点过滤与空节点兜底机制 (`filter` & `empty-fallback`)

在配置机场订阅或大规模节点时，通常需要根据地区（如香港、日本、美国）自动分类构建子策略组。`clash-rs` 为**所有 6 类策略组**均提供了原生的高性能正则过滤与空列表防灾机制：

```yaml
proxy-groups:
  # 示例 1：从全量节点中通过 include-all + filter 自动汇聚香港节点测速，无节点时拒接防漏
  - name: "HK-Auto"
    type: url-test
    include-all: true               # 汇集所有已定义的代理节点
    filter: "(?i)香港|HK|HongKong"   # 不区分大小写的正则筛选
    empty-fallback: "REJECT"        # 若无匹配节点，兜底为 REJECT 避免意外走直连
    url: "http://www.gstatic.com/generate_204"
    interval: 300
    lazy: true
    tolerance: 50
    icon: "https://example.com/hk.png"

  # 示例 2：从外部订阅中通过 use + filter 筛选美国节点，无节点时兜底直连
  - name: "US-Nodes"
    type: select
    use:
      - airport-sub                 # 从 proxy-providers 引入订阅
    filter: "(?i)美国|US|United States"
    empty-fallback: "DIRECT"        # 订阅故障或无节点时自动回退为直连
    proxies:
      - DIRECT                      # 支持在 use 基础上追加显式节点
    icon: "https://example.com/us.png"
```

::: tip 支持复杂的 Lookaround 零宽断言
由于底层采用了 `fancy-regex` 解析引擎，你可以编写包含正向/负向前瞻或后顾断言的高级正则。例如：
- 筛选所有不含流媒体或官网提示的节点：`^(?!.*(官网|重置|流量|到期)).*$`
- 仅筛选包含倍率限制的节点：`(?i)(?=.*(0\.5x|1x)).*香港`
:::

---

## 各策略组专有配置规格与示例

### 1. 手动选择组 (`type: select`)

```yaml
proxy-groups:
  - name: "PROXY"
    type: select
    proxies:
      - "AUTO-BEST"       # 支持嵌套引用其他策略组
      - "Node-HK-01"
      - "Node-SG-01"
      - DIRECT
    # use: [airport-sub]  # 也支持动态引入订阅
    udp: true
    icon: "https://example.com/icon.png"
```

---

### 2. 自动测速选优组 (`type: url-test`)

定时对组内节点测速，自动选取健康且延迟最低的节点：

```yaml
proxy-groups:
  - name: "AUTO-BEST"
    type: url-test
    proxies:
      - "Node-HK-01"
      - "Node-SG-01"
      - "Node-JP-01"
    url: "http://www.gstatic.com/generate_204" # 必填。健康检测测速 URL
    interval: 300                             # 必填。测速周期（秒）
    tolerance: 50                             # 可选，默认: 0。容差阈值（毫秒）：只有新节点比当前节点快 50ms 以上时才切换，防频繁跳跃
    lazy: true                                # 可选，默认: false。懒检测：组内无流量时暂停后台探测
```

---

### 3. 故障回退组 (`type: fallback`)

```yaml
proxy-groups:
  - name: "HA-FALLBACK"
    type: fallback
    proxies:
      - "Node-HK-01"     # 优先使用排在第一位的节点
      - "Node-JP-01"     # 第一位故障时自动降级切换至第二位
      - DIRECT
    url: "http://www.gstatic.com/generate_204" # 必填
    interval: 180                             # 必填。检测间隔（秒）
    lazy: false                               # 可选，默认: false
```

---

### 4. 负载均衡组 (`type: load-balance`)

在多个代理节点间分发网络连接：

```yaml
proxy-groups:
  - name: "LB-POOL"
    type: load-balance
    proxies:
      - "Node-US-01"
      - "Node-US-02"
      - "Node-US-03"
    url: "http://www.gstatic.com/generate_204" # 必填
    interval: 300                             # 必填
    strategy: consistent-hashing               # 可选。负载均衡算法枚举，详见下文
```

#### `strategy` (负载均衡算法枚举)

| 可选枚举值 | 说明 |
| :--- | :--- |
| **`consistent-hashing`** (默认值) | **一致性哈希**。基于访问的目标 IP / 域名进行哈希计算，同一目标始终走同一节点，避免被服务端判定 IP 频繁变动而掉登录。 |
| **`round-robin`** | **简单轮询**。新的网络连接严格依次交替轮流分发至各个节点。 |
| **`sticky-session`** | **黏性会话**。同一客户端来源的流量在会话期间保持绑定至固定节点。 |

---

### 5. 链式中继组 (`type: relay`)

将多个代理节点首尾相连串联成链路：`客户端 -> Node-HK-01 (入口) -> Node-US-01 (出口) -> 目标网站`。

```yaml
proxy-groups:
  - name: "CHAIN-RELAY"
    type: relay
    proxies:
      - "Node-HK-01"     # 前置入口代理
      - "Node-US-01"     # 后置出口落地代理
```

---

### 6. 自适应智能组 (`type: smart`)

`clash-rs` 专有的高级自适应路由组，能够根据网络质量与流量特征自动调优：

```yaml
proxy-groups:
  - name: "SMART-ROUTER"
    type: smart
    proxies:
      - "Node-HK-01"
      - "Node-SG-01"
      - "Node-US-01"
    max-retries: 3        # 可选，默认: 3。单次连接失败时的最大重试次数
    site-stickiness: 0.8  # 可选，默认: 0.8 (范围 0.0-1.0)。站点黏性因子，数值越高越倾向于同一网站复用历史优质节点
    bandwidth-weight: 0.0 # 可选，默认: 0.0 (禁用)。带宽权重考量因子，大于 0 时将带宽吞吐指标纳入算法
```
