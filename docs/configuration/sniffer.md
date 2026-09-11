# 域名嗅探 (Domain Sniffer)

在透明代理（TUN / eBPF / TProxy）模式下，许多应用发起连接时目标可能直接是一个 IP 地址（例如使用了 Fake-IP、直接访问原生 IP 或第三方私有 DNS 解析）。

`clash-rs` 内置的域名嗅探器（Sniffer）能够在 TCP 握手后的首个数据包或 UDP 首包中，以**零拷贝**的方式快速解密提取出真实访问域名（TLS SNI、HTTP Host、QUIC Initial SNI），使得分流规则引擎能够基于精准的域名规则（如 `DOMAIN`, `DOMAIN-SUFFIX`, `GEOSITE`）进行分流，并能在外部面板中还原清晰的访问日志。

---

## 快速启用配置速查

```yaml
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
```

---

## 字段规格全览表

| 配置字段 | 类型 | 是否必填 | 默认值 | 详细说明与取值 |
| :--- | :--- | :--- | :--- | :--- |
| **`enable`** | 布尔值 | **必填** (若使用 Sniffer) | `false` | 是否开启域名嗅探器子系统。 |
| **`force-dns-mapping`**| 布尔值 | 可选 | `false` | 强制利用本地 DNS 历史缓存将目标真实 IP 逆向反查映射为查询过的域名。在非 fake-ip 模式或纯 IP 连接时极具实用价值。 |
| **`parse-pure-ip`** | 布尔值 | 可选 | `true` | 是否对纯 IP 连接（客户端未发起 DNS 解析的原生 IP）执行应用层载荷内容嗅探。 |
| **`override-destination`**| 布尔值 | 可选 | `false` | 全局开关：是否将嗅探出的真实域名覆盖替换出站连接的目标地址（交由远端代理节点发起 DNS 解析）。也可在各协议下方单独覆盖。 |
| **`sniff`** | 映射对象 | 可选 | 见下文 | 各协议细粒度嗅探规则。支持协议枚举：`TLS`、`HTTP`、`QUIC`。 |
| **`skip-domain`** | 字符串列表 | 可选 | `[]` | 跳过嗅探的域名白名单。匹配这些域名的连接将保留原始目标 IP，跳过首包解密。 |
| **`force-domain`** | 字符串列表 | 可选 | `[]` | 强制进行嗅探的域名列表（即使目标已被其他规则过滤）。 |

---

## 嗅探协议枚举与规格 (`sniff:`)

`sniff` 字段支持以下 3 类应用层协议枚举：

| 协议枚举 | 默认嗅探端口 (`ports`) | 提取目标与实现原理 |
| :--- | :--- | :--- |
| **`TLS`** | `[443, 8443]` | 解析 HTTPS 握手第一包的 **ClientHello -> Server Name Indication (SNI)**。零拷贝解密，精确提取目标域名。 |
| **`HTTP`** | `[80, "8080-8880"]` | 解析明文 HTTP 请求头部中的 **`Host: <domain>`** 字段。通常建议将该协议的 `override-destination` 设为 `true`。 |
| **`QUIC`** | `[443]` | 解析 UDP 传输的 HTTP/3 握手包 **Initial Packet -> ClientHello -> SNI**。 |

每个协议内部支持以下两个属性：
- **`ports`**：需要执行嗅探的目标端口列表，支持单端口（如 `443`）或端口范围字符串（如 `"8080-8880"`）。
- **`override-destination`**：布尔值，是否在该协议嗅探成功后将出站目标重写为嗅探出的域名。
