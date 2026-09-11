# 入站协议与 Listeners

除了在顶层通过 `port`、`socks-port` 等快速配置单监听端口外，`clash-rs` 还支持通过 `listeners:` 声明任意数量、带独立名称、支持特定认证甚至具备高防探测回落的高级入站监听器。

::: tip 监听器优先级
当配置文件中同时存在顶层简单端口（如 `port: 7890`）和 `listeners:` 列表时，**`listeners:` 中的定义将生效并拥有更高优先级**。
:::

---

## 常用入站协议类型一览

| 类型 (`type`) | 适用场景 | 核心参数与特性 |
| :--- | :--- | :--- |
| **`http`** | 常规浏览器代理 | 支持标准 HTTP CONNECT 隧道 |
| **`socks`** | 应用程序、游戏代理 | SOCKS5 协议，默认开启 UDP 支持 |
| **`mixed`** | 个人电脑最常用代理端口 | 单端口混合同时处理 HTTP 与 SOCKS5 流量 |
| **`tproxy`** | 软路由透明网关 | Linux TProxy 透明代理（需 `CAP_NET_ADMIN`） |
| **`redir`** | 嵌入式设备透明代理 | Linux iptables REDIRECT 端口重定向（仅 TCP） |
| **`tunnel`** | 端口转发与内网穿透 | 端口流量无条件转发至固定目标地址 |
| **`shadowsocks`**| 代理服务端接入 | 自建 SS 节点服务端，支持 SS2022 与多用户 EIH |
| **`anytls`** | 防主动探测加密接入 | 强抗审查 TLS 协议，支持真实站点探测回落伪装 |

---

## 监听器通用基础字段 (`CommonInboundOpts`)

所有监听器都必须包含以下基础通用属性：

| 字段 | 类型 | 是否必填 | 默认值 | 说明与取值 |
| :--- | :--- | :--- | :--- | :--- |
| **`name`** | 字符串 | **必填** | 无 | 该监听器的唯一标识名称（在分流规则中可通过 `IN-NAME` 规则引用）。 |
| **`type`** | **枚举字符串** | **必填** | 无 | 入站协议类型枚举，可选值见下文详细清单。 |
| **`listen`** | 字符串 | **必填** | 无 | 监听绑定的 IP 地址，如 `"127.0.0.1"`、`"0.0.0.0"`、`"*"`。 |
| **`port`** | 整数 (1-65535) | **必填** | 无 | 监听的网络端口号。 |
| **`allow-lan`** | 布尔值 | 可选 | `false` | 是否允许局域网其他设备连接此监听器（覆盖全局 `allow-lan`）。 |
| **`fw-mark`** | 整数 (u32) | 可选 | 无 | Linux 环境下由该监听器接受的数据包打上的防火墙标记。 |

---

## 监听器专有参数规格与枚举全集

### 1. HTTP / SOCKS / Mixed 入站

```yaml
listeners:
  - name: http-in
    type: http
    listen: 127.0.0.1
    port: 7890

  - name: socks-in
    type: socks
    listen: 127.0.0.1
    port: 7891
    udp: true                     # 可选，默认: true。是否启用 UDP 转发支持

  - name: mixed-in
    type: mixed
    listen: 0.0.0.0
    port: 7892
    udp: true                     # 可选，默认: true
```

---

### 2. Linux 透明代理入站 (`tproxy` / `redir`)

```yaml
listeners:
  - name: tproxy-in
    type: tproxy
    listen: 0.0.0.0
    port: 7893
    udp: true                     # 可选，默认: true。是否接管 UDP 透明代理

  - name: redir-in
    type: redir
    listen: 0.0.0.0
    port: 7894
```

---

### 3. 固定目标转发隧道 (`tunnel`)

将发往该端口的所有数据包无脑转发至指定目标（`target`）：

```yaml
listeners:
  - name: my-tunnel
    type: tunnel
    listen: 127.0.0.1
    port: 7900
    network: [tcp, udp]           # 必填。支持协议列表，可选: ["tcp"], ["udp"], ["tcp", "udp"]
    target: "192.168.1.1:80"      # 必填。固定的目标 IP:Port 或 域名:Port
```

---

### 4. Shadowsocks 服务端入站 (`shadowsocks`)

```yaml
listeners:
  - name: ss-in
    type: shadowsocks
    listen: 0.0.0.0
    port: 8388
    cipher: 2022-blake3-aes-256-gcm # 必填。加密算法
    password: "base64-32-byte-key="  # 必填。服务端主密码/主密钥
    udp: true                       # 可选，默认: true
    # 可选：SS2022 多用户 EIH 配置（通过 IN-USER 规则分流）
    users:
      - name: alice                 # 必填。用户名
        password: "user-key-alice=" # 必填。用户专属 32 字节 Base64 密钥
```

---

### 5. AnyTLS 服务端入站 (`anytls`)

具备针对 GFW 主动探测的主动回落伪装能力：

```yaml
listeners:
  - name: anytls-in
    type: anytls
    listen: 0.0.0.0
    port: 8443
    udp: true                       # 可选，默认: true
    password: "my-secret-password"  # 单用户模式必填
    fallback: "example.com:443"     # 可选。收到未认证非法嗅探探测时，将连接静默反代至此正常网站
    certificate: ./certs/server.crt # 可选。证书文件路径或内联 PEM。省略将自动生成自签证书
    private-key: ./certs/server.key # 可选。私钥文件路径或内联 PEM
    # 可选：多用户支持（声明后将覆盖单用户 password）
    # users:
    #   - name: user1
    #     password: "user1_secret"
```

---

## 动态监听器提供者 (`inbound-providers`)

当你有大量动态生成的监听端口时，可使用 `inbound-providers` 从本地文件或远程订阅集中管理：

```yaml
inbound-providers:
  # 远程 HTTP 提供者
  remote-inbounds:
    type: http                      # 必填。枚举值: http | file
    url: "https://example.com/api/listeners.yaml" # type: http 时必填
    interval: 86400                 # 必填。自动更新拉取间隔（秒）
    path: ./providers/listeners.yaml # 必填。本地缓存写入路径

  # 本地文件提供者
  local-inbounds:
    type: file                      # 必填。枚举值: http | file
    path: ./listeners.yaml          # 必填。本地引用的文件路径
    interval: 3600                  # 必填。文件检查更新间隔（秒）
```
