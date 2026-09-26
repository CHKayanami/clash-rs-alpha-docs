# 配置总览与速查

`clash-rs` 的配置文件采用 **YAML** 格式编写。配置文件中的所有顶级字段及其是否必填、默认值与用途如下表所示：

---

## 顶级字段总览

| 配置项 | 类型 | 是否必填 | 默认值 | 简要说明 | 详情章节 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`port`** | 整数 | 可选 | 无 (不开启) | HTTP 代理监听端口 | [基础通用配置](/configuration/general) |
| **`socks-port`** | 整数 | 可选 | 无 (不开启) | SOCKS5 代理监听端口 | [基础通用配置](/configuration/general) |
| **`mixed-port`** | 整数 | 可选 | 无 (不开启) | 混合代理端口 (HTTP + SOCKS5) | [基础通用配置](/configuration/general) |
| **`redir-port`** | 整数 | 可选 | 无 (不开启) | Linux 重定向透明代理端口 | [基础通用配置](/configuration/general) |
| **`tproxy-port`**| 整数 | 可选 | 无 (不开启) | Linux TProxy 透明代理端口 | [基础通用配置](/configuration/general) |
| **`allow-lan`** | 布尔值 | 可选 | `false` | 是否允许局域网其他设备接入 | [基础通用配置](/configuration/general) |
| **`bind-address`**| 字符串 | 可选 | `"127.0.0.1"` | 绑定的 IP 地址 (`*` 或 `127.0.0.1`) | [基础通用配置](/configuration/general) |
| **`mode`** | **枚举** | 可选 | `rule` | 路由工作模式 (`rule` / `global` / `direct`) | [基础通用配置](/configuration/general) |
| **`log-level`** | **枚举** | 可选 | `info` | 日志输出级别 (`trace` / `debug` / `info` / `warn` / `error` / `off`) | [基础通用配置](/configuration/general) |
| **`ipv6`** | 布尔值 | 可选 | `false` | 是否启用 IPv6 DNS 响应与解析支持 | [基础通用配置](/configuration/general) |
| **`quic`** | 布尔值 | 可选 | `true` | 是否放行 QUIC (UDP 443) 流量（设为 `false` 强制回退 TCP） | [基础通用配置](/configuration/general#quic-流量控制-quic)
| **`routing-mark`** | 整数 (u32) | 可选 | 无 | Linux 平台 Clash 自身出站流量的 fwmark 标记（防止路由环路） | [基础通用配置](/configuration/general#ipv6-与出站绑定) |
| **`external-controller`** | 字符串 | 可选 | 无 (不开启) | 外部控制 REST API 监听地址（如 `127.0.0.1:9090`） | [外部控制器](/configuration/external-controller) |
| **`external-controller-unix`** | 字符串 | 可选 | 无 | Unix Domain Socket 路径 (Linux/macOS) | [外部控制器](/configuration/external-controller) |
| **`external-controller-pipe`** | 字符串 | 可选 | 无 | Windows Named Pipe 命名管道路径 (Windows 专属) | [外部控制器](/configuration/external-controller) |
| **`secret`** | 字符串 | 可选 | `""` (无密码) | 外部控制 API 访问认证密钥 (Bearer Token) | [外部控制器](/configuration/external-controller) |
| **`external-ui`** | 字符串 | 可选 | 默认内置面板 | 外部自定义面板目录（省略此项则默认使用官方内置面板） | [外部控制器](/configuration/external-controller) |
| **`external-ui-url`** | 字符串 | 可选 | 无 | 自动下载并解压 Web UI 压缩包的链接 | [外部控制器](/configuration/external-controller) |
| **`cors-allow-origins`** | 数组 | 可选 | `["*"]` | REST API 允许跨域来源域名白名单 | [外部控制器](/configuration/external-controller) |
| **`dns`** | 对象 | 可选 | 见章节 | 传统本地 DNS 解析器配置 | [传统 DNS 引擎](/configuration/dns) |
| **`dns2`** | 对象 | 可选 | 见章节 | **更灵活的DNS (DNS2) ⚡** (优先于 `dns:`) | [更灵活的DNS](/configuration/dns2) |
| **`hosts`** | 映射 | 可选 | `{}` | 静态主机名解析绑定映射 | [传统 DNS 引擎](/configuration/dns#静态-hosts-解析-hosts) |
| **`sniffer`** | 对象 | 可选 | 见章节 | 应用层域名嗅特器配置 | [域名嗅探](/configuration/sniffer) |
| **`tun`** | 对象 | 可选 | 见章节 | 全局虚拟网卡透明代理模式配置 | [TUN 虚拟网卡](/configuration/tun) |
| **`ebpf`** | 对象 | 可选 | 见章节 | **Linux eBPF 内核线速透明代理 ⚡** | [eBPF 透明代理](/configuration/ebpf) |
| **`listeners`** | 数组 | 可选 | `[]` | 细粒度显式入站监听器列表 | [入站协议与 Listeners](/configuration/inbounds) |
| **`inbound-providers`**| 映射 | 可选 | `{}` | 动态远程入站监听器提供者 | [入站协议与 Listeners](/configuration/inbounds#动态监听器提供者-inbound-providers) |
| **`proxies`** | 数组 | **必填** (若使用代理) | `[]` | 出站代理节点列表 | [出站代理节点](/configuration/proxies) |
| **`proxy-groups`** | 数组 | **必填** (若分流) | `[]` | 策略组列表 (`select` / `url-test` / `fallback` 等) | [策略组](/configuration/proxy-groups) |
| **`proxy-providers`**| 映射 | 可选 | `{}` | 动态代理订阅与节点集提供者 | [代理提供者](/configuration/proxy-providers) |
| **`rules`** | 数组 | **必填** (若分流) | `[]` | 分流路由规则列表 | [分流规则](/configuration/rules) |
| **`rule-providers`** | 映射 | 可选 | `{}` | 动态规则集提供者 (**推荐 MRS 二进制格式**) | [规则提供者](/configuration/rule-providers) |
| **`profile`** | 对象 | 可选 | 见章节 | 运行时状态持久化控制 | [缓存与geo数据](/configuration/profile-and-databases) |
| **`mmdb`** / **`geosite`** | 字符串 | 可选 | 无 | GeoIP / GeoSite 本地数据文件路径 (*兼容遗留，不推荐全量文件*) | [缓存与geo数据](/configuration/profile-and-databases) |
| **`experimental`** | 对象 | 可选 | 见章节 | 实验性底层优化参数（TCP 缓冲区大小） | [基础通用配置](/configuration/general#实验性底层参数-experimental) |

---

## YAML 锚点与合并引用特性 ⚡

`clash-rs` 全面支持标准 YAML 规范的**锚点（Anchors, `&`）**与**合并键（Merge Keys, `<<: *`）**。你可以将重复出现的节点配置、TLS 选项或健康检查模板提取为公共锚点，大幅缩减配置文件体积：

```yaml
# 1. 定义公共节点通用模板锚点
pr: &default-node
  type: socks5
  server: 127.0.0.1
  port: 1080
  udp: true

# 2. 定义健康检查公共模板
hc: &default-health-check
  enable: true
  url: "http://www.gstatic.com/generate_204"
  interval: 300

proxies:
  - name: "node-01"
    <<: *default-node
    server: 1.1.1.1
    port: 8080

  - name: "node-02"
    <<: *default-node
    server: 2.2.2.2
    port: 9090
```

---

## 配置文件完整层级骨架

```yaml
# 1. 基础入站与通用配置
port: 7890
socks-port: 7891
mixed-port: 7892
allow-lan: false
bind-address: "127.0.0.1"
mode: rule
log-level: info
ipv6: false
quic: true

# 2. 外部控制器与 Web 面板
external-controller: 127.0.0.1:9090
secret: ""

# 3. 本地 DNS (可选用传统 dns 或更灵活的 dns2)
dns:
  enable: true
  listen: 127.0.0.1:1053
  enhanced-mode: fake-ip
  nameserver:
    - 223.5.5.5
    - 119.29.29.29

# 4. 高级入站 (可选)
tun:
  enable: false
ebpf:
  enable: false
sniffer:
  enable: false

# 5. 节点与策略组
proxies: []
proxy-groups: []
proxy-providers: {}

# 6. 路由规则与规则集
rules: []
rule-providers: {}
```
