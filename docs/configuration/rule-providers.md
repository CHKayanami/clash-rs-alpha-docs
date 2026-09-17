# 规则提供者 (Rule Providers)

`rule-providers` 允许从本地文件或远程 HTTP/HTTPS 地址动态加载分流规则集合，实现规则的模块化管理、版本分离与定时静默更新。

---

::: tip 官方强烈推荐：按需引入 MRS 二进制规则集
为了极致性能与低内存占用，`clash-rs` **不推荐**使用全量 `geosite.dat` / `Country.mmdb`，而是推荐通过 `rule-providers` 配合 **`format: mrs`**，从 **[DustinWin/ruleset_geodata](https://github.com/DustinWin/ruleset_geodata/releases#release-mihomo-ruleset)** 仓库按需引入切分好的轻量级二进制规则文件：
- **微秒级直读**：二进制结构直读入内存（Succinct Trie / Radix Tree），免去数万行文本/YAML的慢速反序列化；
- **内存占用锐减 90%+**：单个规则仅几十 KB，无需承载全球无关国家数据；
- **模块化更新**：各应用和地区的规则相互独立，按需定期静默拉取。
:::

---

## 完整配置速查示例 (推荐 MRS 格式)

```yaml
rule-providers:
  # 1. 国内域名直连规则集 (MRS 域名二进制)
  cn-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/cn.mrs"
    path: ./rules/cn-domain.mrs
    interval: 86400

  # 2. 境外常用代理域名集 (MRS 域名二进制)
  proxy-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/google.mrs"
    path: ./rules/google.mrs
    interval: 86400

  # 3. 国内 IP 归属地直连规则集 (MRS IP-CIDR 二进制，替代全量 mmdb)
  cn-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/cn_ip.mrs"
    path: ./rules/cn-ip.mrs
    interval: 86400

  # 4. Telegram 专有 IP 段
  telegram-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/telegram_ip.mrs"
    path: ./rules/telegram_ip.mrs
    interval: 86400

  # 5. 本地私有自定义规则集 (兼容 text / yaml)
  custom-local:
    type: file
    behavior: classical
    format: yaml
    path: ./rules/custom.yaml
```

---

## 字段规格全览表

| 配置字段 | 类型 | 是否必填 | 默认值 | 详细说明与取值 |
| :--- | :--- | :--- | :--- | :--- |
| **`type`** | **枚举字符串** | **必填** | 无 | 提供者类型枚举，可选值：<br>• **`http`**：远程 HTTP/HTTPS 规则文件下载；<br>• **`file`**：本地规则集文件；<br>• **`inline`**：直接在配置中嵌入规则。 |
| **`behavior`** | **枚举字符串** | **必填** | 无 | **规则匹配行为模式**，可选值：`domain`、`ipcidr`、`classical`。详见下方枚举全集说明。 |
| **`format`** | **枚举字符串** | 可选 | `yaml` | **规则集文件格式**，可选值：`yaml`、`text`、`mrs`。详见下方枚举全集说明。 |
| **`url`** | 字符串 (URL) | `type: http` 时**必填** | 无 | 远程规则集文件下载地址。 |
| **`path`** | 字符串 (文件路径) | 可选 | URL MD5 自动派生 | 本地规则集保存或缓存路径（相对于工作目录）。若省略，核心将自动使用 URL 的 MD5 哈希生成内部缓存。 |
| **`interval`** | 整数 (秒) | 可选 | `0` (不自动重刷) | 自动检查并拉取最新规则集的间隔时间（秒）。 |
| **`proxy`** | 字符串 | 可选 | `DIRECT` | 下载该规则集时指定的出站代理节点或策略组名称。 |
| **`headers`** | 键值映射 (字符串: 列表) | 可选 | `{}` | 下载规则集时发送的自定义 HTTP 报头（别名: `header`）。 |
| **`payload`** | 字符串列表 | 可选 | `[]` | 直接内联嵌入的规则清单（别名: `inline-rules`）。 |

---

## 枚举类配置全集说明

### 1. `behavior` (规则行为模式)

| 可选枚举值 | 说明 |
| :--- | :--- |
| **`domain`** | **纯域名集合**。文件内部仅包含域名或域名后缀。底层使用高性能前缀/后缀基数树构建，匹配性能最强，内存占用最低。 |
| **`ipcidr`** | **纯 IP-CIDR 集合**。文件内部仅包含 IPv4 / IPv6 网段。底层构建高效 Radix 前缀树，秒级完成路由裁决。 |
| **`classical`** | **经典复合模式**。规则集内可以混合包含 `DOMAIN`, `DOMAIN-SUFFIX`, `IP-CIDR`, `GEOIP` 等各类分流规则类型。 |

### 2. `format` (文件编码格式)

| 可选枚举值 | 说明 |
| :--- | :--- |
| **`mrs`** <br>*(官方强烈推荐)* | **二进制预编译规则集** (Mihomo Rule Set)。<br>• 经紧凑二进制序列化，包含特化 Succinct Trie 域名索引与 Radix Tree IP-CIDR 索引；<br>• 文件体积仅数十 KB，加载与解析零性能开销，内存占用极低；<br>• **注意**：`mrs` 格式仅支持 `behavior: domain` 或 `behavior: ipcidr`，不支持 `classical`；<br>• 推荐规则源：[DustinWin/ruleset_geodata (mihomo-ruleset)](https://github.com/DustinWin/ruleset_geodata/releases#release-mihomo-ruleset)。 |
| **`yaml`** (默认值) | **标准 YAML 格式**。文件顶层为 `payload: [...]` 结构。解析速度适中。 |
| **`text`** | **纯文本换行格式**。每行声明一条规则或单个域名/IP，无需多余语法修饰。 |

---

## 在 `rules` 中引用规则集

在主规则列表中，使用 `RULE-SET` 语法调用已声明的规则集（推荐以替代旧的 `GEOSITE` / `GEOIP` 规则）：

```yaml
rules:
  # 优先分流特定境外服务域名（MRS 格式）
  - RULE-SET,proxy-domain,PROXY

  # 国内域名直连（MRS 格式，替代 GEOSITE,cn）
  - RULE-SET,cn-domain,DIRECT

  # Telegram 专有 IP 段
  - RULE-SET,telegram-ip,PROXY,no-resolve

  # 国内 IP-CIDR 直连（MRS 格式，替代 GEOIP,CN）
  - RULE-SET,cn-ip,DIRECT,no-resolve

  # 私有自定义本地规则集
  - RULE-SET,custom-local,PROXY

  # 最终兜底规则
  - MATCH,PROXY
```
