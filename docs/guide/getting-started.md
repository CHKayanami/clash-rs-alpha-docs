# 快速开始

本指南将带你从零开始安装并运行 **clash-rs**，并完成基础的配置文件编写与连通性测试。

---

## 1. 下载与安装

`clash-rs` 提供了针对主流操作系统与 CPU 架构的预编译可执行文件：

- 访问官方发布页面：[GitHub Releases](https://github.com/CHKayanami/clash-rs/releases)
- 下载对应平台压缩包（如 Linux `x86_64-unknown-linux-musl` / `aarch64`、macOS `x86_64-apple-darwin` / `aarch64-apple-darwin`、Windows `x86_64-pc-windows-msvc`）。

::: tip Windows 用户注意
在 Windows 下如果需要使用 TUN 虚拟网卡功能，需要将对应架构的 [wintun.dll](https://wintun.net/) 放置在可执行程序同级目录下，并以管理员身份运行。
:::

---

## 2. 最小配置文件示例

在可执行文件同级目录创建 `config.yaml`（或者放置在 `~/.config/clash-rs/config.yaml`）：

```yaml
# 混合入站端口（同时支持 HTTP 与 SOCKS5）
mixed-port: 7890

# 运行模式：rule（规则分流）/ global（全局代理）/ direct（全部直连）
mode: rule

# 日志级别：info / debug / warning / error / off
log-level: info

# 允许局域网设备连接
allow-lan: false
bind-address: 127.0.0.1

# RESTful 外部控制接口（可配合 Dashboard 使用）
external-controller: 127.0.0.1:9090
secret: ""

# DNS 配置
dns:
  enable: true
  listen: 0.0.0.0:1053
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  nameserver:
    - 223.5.5.5
    - 119.29.29.29

# 节点列表
proxies:
  - name: "示例 Shadowsocks 节点"
    type: ss
    server: 1.2.3.4
    port: 8388
    cipher: aes-256-gcm
    password: "your-password"

# 策略组
proxy-groups:
  - name: PROXY
    type: select
    proxies:
      - "示例 Shadowsocks 节点"
      - DIRECT

# 规则提供者（推荐按需引入轻量 mrs 规则，无需下载全量庞大 GeoData）
rule-providers:
  cn-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/cn_ip.mrs"
    path: ./rules/cn-ip.mrs
    interval: 86400

# 分流规则
rules:
  - DOMAIN-SUFFIX,google.com,PROXY
  - DOMAIN-KEYWORD,github,PROXY
  - DOMAIN-SUFFIX,cn,DIRECT
  - RULE-SET,cn-ip,DIRECT,no-resolve
  - MATCH,PROXY
```

---

## 3. 启动运行

在终端中执行：

::: code-group

```bash [默认路径]
# 默认读取当前工作目录或 ~/.config/clash-rs/ 下的 config.yaml
./clash-rs
```

```bash [指定配置文件与工作目录]
# -c 指定配置文件，-d 指定运行数据与缓存目录
./clash-rs -d ~/.config/clash-rs -c ~/.config/clash-rs/config.yaml
```

```bash [查看所有启动参数]
./clash-rs --help
```

:::

启动成功后，终端将输出如下初始化日志：

```log
[INFO] clash-rs is starting up
[INFO] Inbound listener [mixed] started at 127.0.0.1:7890
[INFO] External controller RESTful API listening on 127.0.0.1:9090
[INFO] DNS server listening on 0.0.0.0:1053
```

---

## 4. 验证与测试代理

在另一个终端测试代理是否正常生效：

::: code-group

```bash [HTTP 代理测试]
curl -x http://127.0.0.1:7890 https://httpbin.org/ip
```

```bash [SOCKS5 代理测试]
curl --socks5-hostname 127.0.0.1:7890 https://httpbin.org/ip
```

:::

---

## 5. 网页控制面板 (Dashboard)

### 🌟 首推：官方内置面板（零配置开箱即用）
`clash-rs` 二进制文件中直接内置了专属的现代 Web 控制面板。只要配置了 `external-controller: 127.0.0.1:9090`，无需下载任何前端包，启动后直接在浏览器中打开：

👉 **`http://127.0.0.1:9090/ui`**

即可瞬间浏览连接状态、实时带宽折线图与节点切换！若配置了 `secret`，在弹窗中填入密钥即可连接。

### 其它第三方客户端与面板
你也可以配合现有的第三方 Clash 客户端前端使用：
- [Clash Nyanpasu](https://github.com/LibNyanpasu/clash-nyanpasu)（跨平台桌面客户端）
- [Metacubexd](https://github.com/MetaCubeX/metacubexd) / [Yacd](https://github.com/haishanh/yacd)（第三方 Web 面板）
