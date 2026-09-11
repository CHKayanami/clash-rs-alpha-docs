# 分流规则 (Rules)

规则引擎（Rules）是 `clash-rs` 的核心中枢。连接建立时，流量将按照自上而下的顺序逐条遍历 `rules:` 中的规则。**一旦命中第一条规则，立即终止后续匹配**，并将流量调度给指定的出站目标（节点、策略组、`DIRECT` 或 `REJECT`）。

---

## 规则语法格式

规则的基本语法为单行逗号分隔字符串：

```yaml
rules:
  - 匹配类型,匹配参数,出站目标[,可选控制标志]
```

例如：
```yaml
rules:
  - DOMAIN-SUFFIX,google.com,PROXY
  - IP-CIDR,127.0.0.0/8,DIRECT
  - GEOIP,CN,DIRECT,no-resolve
  - MATCH,FINAL-GROUP
```

---

## 所有规则匹配类型详解

### 1. 域名匹配类型

| 规则类型 | 示例 | 匹配说明 |
| :--- | :--- | :--- |
| `DOMAIN` | `DOMAIN,v2ex.com,PROXY` | 仅严格精确匹配该域名，不包含子域名 |
| `DOMAIN-SUFFIX` | `DOMAIN-SUFFIX,youtube.com,PROXY` | 后缀匹配，匹配该域名及其所有子域名（如 `m.youtube.com`） |
| `DOMAIN-KEYWORD`| `DOMAIN-KEYWORD,google,PROXY` | 关键字匹配，域名包含该字符串即命中 |
| `DOMAIN-REGEX`  | `DOMAIN-REGEX,^.*\.apple\.com$,DIRECT` | 正则表达式匹配 |
| `GEOSITE`       | `GEOSITE,category-ads-all,REJECT` | 匹配 `geosite.dat` 域名集合（*兼容遗留，⚠️ **必须明确配置 `geosite` 路径与下载**，否则规则将降级为 REJECT*） |

::: danger ⚠️ 重要前提：GEO 相关规则必须明确配置数据文件下载
`clash-rs` **不会**默认内置或隐式静默下载全量地理数据库！

如果你在分流规则中使用了 `GEOSITE`、`GEOIP` 或 `IP-ASN`，**必须在配置文件顶层明确声明对应的数据文件及下载 URL**（详见 [缓存与geo数据](/configuration/profile-and-databases)），或者本地工作目录下已提前放置好对应文件：
- **`GEOSITE` 规则**：必须显式配置 `geosite: geosite.dat` 及 `geosite-download-url: "..."`。**若未配置且本地不存在该文件，解析将报错并将该规则强制降级为 `REJECT` 拦截！**
- **`GEOIP` 规则**：必须显式配置 `mmdb: Country.mmdb` 及 `mmdb-download-url: "..."`。**若未配置且本地不存在该文件，查询将直接失效（永远判定为不匹配并打印警告）！**
- **`IP-ASN` 规则**：必须显式配置 `asn-mmdb: Country-asn.mmdb` 及 `asn-mmdb-download-url: "..."`。

> 💡 **首选替代方案**：强烈推荐使用 **[`RULE-SET`](/configuration/rule-providers)** 配合 **MRS 二进制规则集**（来自 [DustinWin/ruleset_geodata](https://github.com/DustinWin/ruleset_geodata/releases#release-mihomo-ruleset)），由提供者自行按需静默拉取，无需挂载数十 MB 的全量数据库，零心智负担！
:::

::: tip no-resolve 标志的作用
当一条规则为 IP 类规则（如 `IP-CIDR`、`GEOIP` 或包含 IP-CIDR 的 `RULE-SET`）时，若客户端发起的是域名请求，`clash-rs` 默认会发起一次 DNS 查询获取其真实 IP 以便进行 IP 匹配。
若在末尾附加 `,no-resolve`（如 `RULE-SET,cn-ip,DIRECT,no-resolve`），则告诉核心：**若当前请求只有域名，直接跳过此规则，绝不触发 DNS 解析**。这对于防止 DNS 污染和提升性能非常关键。
:::

---

### 2. IP 与地理位置类型

| 规则类型 | 示例 | 说明 |
| :--- | :--- | :--- |
| `IP-CIDR` | `IP-CIDR,192.168.0.0/16,DIRECT` | 目标 IPv4 掩码网段匹配（支持 `,no-resolve`） |
| `IP-CIDR6` | `IP-CIDR6,2001:db8::/32,DIRECT` | 目标 IPv6 掩码网段匹配（支持 `,no-resolve`） |
| `GEOIP` | `GEOIP,CN,DIRECT` | 基于 MaxMind MMDB 匹配目标 IP 归属国（*⚠️ **必须明确配置 `mmdb` 与下载地址**，否则查询直接失效；建议改用 `RULE-SET` 配合 MRS*） |
| `IP-ASN` | `IP-ASN,13335,PROXY` | 匹配目标 IP 所属自治系统编号（*⚠️ **必须明确配置 `asn-mmdb` 与下载地址**，否则无法匹配*） |

---

### 3. 源地址与端口类型

| 规则类型 | 示例 | 说明 |
| :--- | :--- | :--- |
| `SRC-IP-CIDR` | `SRC-IP-CIDR,192.168.1.50/32,PROXY` | 匹配发起请求的客户端局域网源 IP |
| `SRC-PORT` | `SRC-PORT,1234,DIRECT` | 匹配发起请求的源端口 |
| `DST-PORT` | `DST-PORT,80,DIRECT` | 匹配访问的目标端口（如 `443` 或 `80`） |

---

### 4. 监听器与身份来源类型

| 规则类型 | 示例 | 说明 |
| :--- | :--- | :--- |
| `IN-NAME` | `IN-NAME,ss-in,PROXY` | 匹配流量进入的具体监听器名称（在 `listeners:` 中定义） |
| `IN-TYPE` | `IN-TYPE,tproxy,PROXY` | 匹配入站类型（如 `http` / `socks` / `tproxy` / `tun`） |
| `IN-USER` | `IN-USER,alice,SPECIAL-GROUP` | 匹配通过特定账号登录的用户（如 SS2022 / AnyTLS 多用户） |

---

### 5. 进程名称类型

| 规则类型 | 示例 | 说明 |
| :--- | :--- | :--- |
| `PROCESS-NAME` | `PROCESS-NAME,Telegram.exe,PROXY` | 匹配发起网络连接的本地进程主程序名称 |
| `PROCESS-PATH` | `PROCESS-PATH,/usr/bin/curl,DIRECT` | 匹配发起连接的本地程序完整路径 |

---

### 6. 规则集与最终兜底

| 规则类型 | 示例 | 说明 |
| :--- | :--- | :--- |
| `RULE-SET` <br>*(官方首推)* | `RULE-SET,cn-domain,DIRECT` | **首选分流方式**。引用 [rule-providers](/configuration/rule-providers) 声明的高性能二进制（MRS）或 YAML 规则集 |
| `MATCH` | `MATCH,FINAL` | **全局最终兜底规则**。若前面所有规则均未命中，流量一律走此规则 |

---

## 现代推荐分流示范 (基于 RULE-SET + MRS)

::: tip 告别全量 GeoData，按需引入二进制规则集
以下示例采用 `RULE-SET` 配合 MRS 二进制规则文件（可从 [DustinWin/ruleset_geodata](https://github.com/DustinWin/ruleset_geodata/releases#release-mihomo-ruleset) 按需引入），无需下载数十 MB 的全量数据库，内存极小，毫秒级快速匹配：
:::

```yaml
rules:
  # 1. 拦截广告与恶意流量（MRS 域名规则）
  - RULE-SET,adblock,REJECT

  # 2. 局域网与私有 IP 直连
  - IP-CIDR,127.0.0.0/8,DIRECT
  - IP-CIDR,172.16.0.0/12,DIRECT
  - IP-CIDR,192.168.0.0/16,DIRECT
  - IP-CIDR,10.0.0.0/8,DIRECT

  # 3. 常见需要走代理的平台（MRS 规则或后缀）
  - RULE-SET,google,PROXY
  - DOMAIN-SUFFIX,github.com,PROXY
  - DOMAIN-KEYWORD,twitter,PROXY
  - RULE-SET,telegram-ip,PROXY,no-resolve

  # 4. 国内常用服务与 IP 直连（MRS 规则集，使用 no-resolve 避免多余 DNS 解析）
  - RULE-SET,cn-domain,DIRECT
  - RULE-SET,cn-ip,DIRECT,no-resolve

  # 5. 最终兜底
  - MATCH,PROXY
```
