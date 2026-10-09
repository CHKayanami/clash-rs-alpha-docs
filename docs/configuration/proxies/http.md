# HTTP (CONNECT)

HTTP 代理出站使用标准的 HTTP CONNECT 隧道协议转发 TCP 流量。节点类型为 `type: http`。支持明文 HTTP 代理与加密 HTTPS 代理、Basic Auth 用户名密码认证、自定义请求头 (Headers)、服务器证书指纹校验以及链式代理。

## 基础示例

::: code-group

```yaml [基础 HTTP 代理]
proxies:
  - name: HTTP-Proxy
    type: http
    server: proxy.example.com
    port: 8080
```

```yaml [用户认证与链式代理]
proxies:
  - name: HTTP-Auth
    type: http
    server: proxy.example.com
    port: 8080
    username: my-username
    password: my-password
    tfo: false
    # 经由前置节点发起连接
    connect-via: Front-Proxy
```

```yaml [HTTPS 代理 (TLS)]
proxies:
  - name: HTTPS-Proxy
    type: http
    server: proxy.example.com
    port: 443
    tls: true
    sni: proxy.example.com
    skip-cert-verify: false
    # 可选：固定服务器证书 SHA-256 指纹
    # fingerprint: 11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff
```

```yaml [自定义请求头]
proxies:
  - name: HTTP-Custom-Headers
    type: http
    server: proxy.example.com
    port: 8080
    headers:
      X-Proxy-Token: secret-token-123
      User-Agent: clash-rs/outbound
```

:::

## 配置字段说明

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `name` | 字符串 | **必填** | 节点名称，在整个配置中必须唯一 |
| `type` | 字符串 | **必填** | 必须为 `http` |
| `server` | 字符串 | **必填** | 代理服务器域名或 IP 地址 |
| `port` | 整数 | **必填** | 代理服务器端口 |
| `username` | 字符串 | 可选 | HTTP Basic 认证用户名 |
| `password` | 字符串 | 可选 | HTTP Basic 认证密码 |
| `tls` | 布尔值 | `false` | 是否使用 TLS 加密连接代理服务器（即 HTTPS 代理） |
| `sni` | 字符串 | `server` | TLS 握手使用的 SNI（服务器名称提示） |
| `skip-cert-verify` | 布尔值 | `false` | 启用 TLS 时，是否跳过服务器证书验证 |
| `fingerprint` | 字符串 | 可选 | 启用 TLS 时，服务器证书的 SHA-256 十六进制指纹（64 位字符），用于证书 Pinning 校验 |
| `headers` | 键值映射表 | 可选 | 发送 HTTP CONNECT 请求时附加的自定义 Header 列表 |
| `connect-via` | 字符串 | 可选 | 别名 `dialer-proxy`，指定前置节点或策略组名称实现链式代理 |
| `tfo` | 布尔值 | `false` | 是否开启 TCP Fast Open（需要系统内核及网络环境支持） |

## 协议工作机制与限制

- **流量类型**：HTTP CONNECT 出站仅支持转发 **TCP** 流量；**不支持 UDP**。若分流规则将 UDP 连接分派给 HTTP 代理节点，该连接将无法通过此节点传输。
- **认证方式**：配置 `username` 与 `password` 时，clash-rs 会在向代理服务器发送的 `CONNECT` 请求中自动附加 `Proxy-Authorization: Basic <base64(user:pass)>` 头。
- **目标地址格式**：握手请求严格按 HTTP Authority 规范发送，针对 IPv6 目标会自动包裹方括号（如 `CONNECT [::1]:443 HTTP/1.1`）。
- **自定义请求头校验**：`headers` 中的 Header 键值会受到合法性检查，不允许包含回车换行符等特殊字符，以防止 Header 注入攻击；若自定义 Headers 中未指定 `Host`，会自动以目标主机地址补齐。
- **TLS 与安全特性**：
  - 开启 `tls: true` 时，ALPN 固定协商为 `http/1.1`。
  - 支持通过 `fingerprint` 进行 SHA-256 证书指纹固定校验。
  - 当前不支持自定义 ALPN、客户端证书双向认证（mTLS）以及 `client-fingerprint` 浏览器指纹模拟。
- **多路复用**：HTTP 出站不支持 H2MUX 连接复用，请勿配置 `smux`。
- **概念区分**：
  - 本页介绍的是**出站代理节点**（即 clash-rs 作为客户端去连接外部 HTTP 代理）。
  - clash-rs 本地开放给浏览器/局域网设备使用的 HTTP 代理监听入口，请参阅 [入站配置 (Inbounds)](/configuration/inbounds)。
  - VMess / VLESS 中的 `network: http` 为底层传输载体配置，与独立的 HTTP 代理节点不是同一个概念。
