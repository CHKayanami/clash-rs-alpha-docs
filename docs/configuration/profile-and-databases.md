# 缓存与geo数据 (Profile & Geo Data)

本章节介绍 `clash-rs` 的运行时状态持久化控制（Profile）、外部地理位置与域名数据文件（GeoIP / GeoSite / ASN）配置及其自动下载更新机制。

---

## 运行时状态持久化 (`profile:`)

`clash-rs` 内置了轻量级本地持久化数据库（`cache.db`），用于在程序重启后依然恢复用户的操作状态与解析映射。

```yaml
profile:
  store-selected: true
  store-fake-ip: false
  store-smart-stats: true
```

### 字段规格全览表

| 配置字段 | 类型 | 是否必填 | 默认值 | 详细说明与取值 |
| :--- | :--- | :--- | :--- | :--- |
| **`store-selected`** | 布尔值 | 可选 | `false` | 是否持久化记录你在策略组中手动选择 (`select`) 的节点。设为 `true` 时，重启 clash-rs 后依然保持你在 Web 面板中切换好的节点，无需重新手动选择。 |
| **`store-fake-ip`** | 布尔值 | 可选 | `false` | 是否持久化 Fake-IP 域名与虚拟 IP 的映射关系表到 `cache.db`。设为 `true` 可防止核心重启后，客户端因缓存了旧 Fake-IP 导致首次建立连接时发生临时断流。 |
| **`store-smart-stats`**| 布尔值 | 可选 | `false` | 是否持久化智能策略组 (`smart`) 的历史质量统计数据与延迟评分。 |

---

## 地理位置与分流数据库 (Geo Data，兼容性遗留)

::: danger 架构设计建议：不推荐使用全量 GeoData 文件
在 `clash-rs` 中，**强烈不推荐**配置和使用全量的 `geosite.dat` 或 `Country.mmdb` 文件。

- **为什么不推荐全量文件？**
  1. **体积臃肿**：全量文件动辄几十 MB，初次拉取和更新缓慢；
  2. **内存浪费与启动变慢**：全量 GeoData 包含数万条日常根本不会访问的国家与冷门域名，启动时反序列化解析消耗大量 CPU，并常驻数十上百 MB 内存；
  3. **粒度过粗**：更新时必须全量重下，无法做到不同应用类别规则的独立灰度与刷新。

- **官方首推的最佳实践：按需引入 MRS 二进制规则集**
  我们推荐使用 **[`rule-providers`](/configuration/rule-providers)** 并指定 `format: mrs`，按需引入针对特定场景分割好的二进制规则集（例如仅引入 `cn.mrs`、`apple.mrs`、`cn_ip.mrs`）。
  规则文件体积仅几十 KB 至几百 KB，基于 Succinct Trie / Radix Tree 二进制直读，实现微秒级加载且内存零冗余。
  
  推荐获取源：**[DustinWin/ruleset_geodata (Mihomo 规则集 Releases)](https://github.com/DustinWin/ruleset_geodata/releases#release-mihomo-ruleset)**
::: warning ⚠️ 必须明确配置数据下载地址
`clash-rs` **绝不会默认自带** 任何全量数据库文件。若在分流规则中坚持使用 `GEOSITE` / `GEOIP` / `IP-ASN` 规则，**必须明确配置以下对应的数据文件路径及 `download-url`**（或确保本地工作目录中已有该文件），否则 `GEOSITE` 规则将直接降级为 `REJECT`，`GEOIP` 规则将永远匹配失败！
:::

若出于兼容传统配置的目的，仍可通过以下字段指定本地或远端全量数据包：

```yaml
# 兼容模式：传统全量数据库配置（不推荐）
# mmdb: Country.mmdb
# mmdb-download-url: "https://github.com/Loyalsoldier/geoip/releases/download/20260101/Country.mmdb"

# asn-mmdb: Country-asn.mmdb
# asn-mmdb-download-url: "https://github.com/Loyalsoldier/geoip/releases/download/20260101/Country-asn.mmdb"

# geosite: geosite.dat
# geosite-download-url: "https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geosite.dat"
```

### 字段规格全览表 (传统兼容)

| 配置字段 | 类型 | 是否必填 | 默认值 | 详细说明与取值 |
| :--- | :--- | :--- | :--- | :--- |
| **`mmdb`** | 字符串 (文件路径) | 可选 | 无 | 国家地理 IP 数据库文件路径（MaxMind GeoLite2 `.mmdb` 格式）。*（不推荐，建议改用 mrs 格式的 IP-CIDR provider）* |
| **`mmdb-download-url`** | 字符串 (URL) | 可选 | 无 | 当本地 `mmdb` 文件不存在时，启动时自动从该 URL 下载。 |
| **`asn-mmdb`** | 字符串 (文件路径) | 可选 | 无 | 自治系统 ASN 数据库文件路径。用于支持 `IP-ASN` 规则。 |
| **`asn-mmdb-download-url`** | 字符串 (URL) | 可选 | 无 | 当本地 `asn-mmdb` 文件不存在时的自动下载地址。 |
| **`geosite`** | 字符串 (文件路径) | 可选 | 无 | GeoSite 域名分类数据库文件路径（v2ray `geosite.dat` 格式）。*（不推荐，建议改用 mrs 格式的 DOMAIN provider）* |
| **`geosite-download-url`** | 字符串 (URL) | 可选 | 无 | 当本地 `geosite` 文件不存在时的自动下载地址。 |

---

## 实验性选项 (`experimental:`)

```yaml
experimental:
  tcp-buffer-size: 65536
  ignore-resolve-fail: true
```

| 配置字段 | 类型 | 是否必填 | 默认值 | 详细说明与取值 |
| :--- | :--- | :--- | :--- | :--- |
| **`tcp-buffer-size`** | 整数 (字节) | 可选 | 系统默认 | 用于双向 TCP 数据拷贝时的缓冲区字节大小（例如 `65536` 表示 64KB）。在大带宽吞吐场景下调大此值可进一步提升传输效率。 |
| **`ignore-resolve-fail`** | 布尔值 | 可选 | `false` | 是否忽略 DNS 解析失败错误。开启后若某些域名解析失败将静默处理而不打印大量错误日志。 |
