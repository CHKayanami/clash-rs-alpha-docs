# TUN 虚拟网卡接管

TUN 模式允许 `clash-rs` 在操作系统中创建虚拟网卡（Virtual Network Adapter），并通过自动配置系统路由表将全系统或指定网段的 TCP/UDP 流量全面接管至代理核心，无需各个应用程序主动配置代理。

---

## 快速启用配置速查

```yaml
tun:
  enable: true
  stack: system
  device: "utun1989"
  inet4-address: "198.18.0.1/16"
  inet6-address: "fdfe:dcba:9876::1/64"
  auto-route: true
  auto-detect-interface: true
  dns-hijack:
    - "0.0.0.0:53"
  strict-route: true
```

---

## 字段规格与参数全览表

| 配置字段 | 类型 | 是否必填 | 默认值 | 详细说明与取值 |
| :--- | :--- | :--- | :--- | :--- |
| **`enable`** | 布尔值 | **必填** (若使用 TUN) | `false` | 是否开启 TUN 虚拟网卡接管模式。 |
| **`stack`** | **枚举字符串** | 可选 | `system` | **TCP/IP 网络协议栈实现**。详见下方枚举说明。 |
| **`device`** | 字符串 | 可选 | `"utun1989"` | 虚拟设备标识符。macOS 必须包含 `utun` 前缀（如 `utun1989`）；Linux 可写作 `dev://tun0` 或 `tun0`；也支持传入已打开的文件描述符 `fd://3`。 |
| **`enable-tcp`** | 布尔值 | 可选 | `true` | 是否在 TUN 中处理 TCP 流量。若设为 `false`，则 TUN 网卡仅接收和转发 UDP 数据。 |
| **`inet4-address`** | 字符串 (CIDR) | 可选 | `"198.18.0.1/16"` | TUN 虚拟网卡分配的 IPv4 地址与掩码前缀（别名: `gateway`）。 |
| **`inet6-address`** | 字符串 (CIDR) | 可选 | `"fdfe:dcba:9876::1/64"` | TUN 虚拟网卡分配的 IPv6 地址与掩码前缀（别名: `gateway-v6`）。 |
| **`auto-route`** | 布尔值 | 可选 | `false` | 是否由核心自动向操作系统路由表安装全局默认路由（别名: `route-all`）。 |
| **`auto-detect-interface`**| 布尔值 | 可选 | `false` | 是否自动探测并动态追踪操作系统默认物理出口网卡的变化（如在 Wi-Fi 与有线网切换时自动更新路由）。 |
| **`inet4-route-address`** | 字符串列表 | 可选 | `[]` | 手动指定路由进 TUN 网卡的 IPv4 网段（当 `auto-route: false` 时使用）。 |
| **`inet6-route-address`** | 字符串列表 | 可选 | `[]` | 手动指定路由进 TUN 网卡的 IPv6 网段。 |
| **`inet4-route-exclude-address`** | 字符串列表 | 可选 | `[]` | 明确排除在 TUN 之外的 IPv4 网段（这些流量将直接由物理局域网网关直连发出）。 |
| **`inet6-route-exclude-address`** | 字符串列表 | 可选 | `[]` | 明确排除在 TUN 之外的 IPv6 网段。 |
| **`strict-route`** | 布尔值 | 可选 | `false` | **Linux 严格路由模式**。启用策略路由黑洞保护，防止不可达流量泄漏到默认物理网卡。 |
| **`dns-hijack`** | 布尔值 或 列表 | 可选 | `false` | 截获发往 53 端口的 DNS 请求并重定向给本地 Clash DNS 处理。填 `true` 劫持所有发往 53 的流量；也可填具体地址列表如 `["0.0.0.0:53", "8.8.8.8:53"]`。 |
| **`mtu`** | 整数 | 可选 | `1500` | 虚拟网卡最大传输单元 (MTU)。Windows 平台当 GSO 关闭时默认 65535。 |
| **`gso`** | 布尔值 | 可选 | `true` (Linux) | **Linux 专属**。启用通用分段卸载 (Generic Segmentation Offload)，大幅度提升大包吞吐吞吐率。 |
| **`gso-max-size`** | 整数 | 可选 | `65536` | **Linux 专属**。GSO 最大缓冲区大小（字节）。 |
| **`udp-timeout`** | 整数 (秒) | 可选 | `300` | UDP 会话闲置老化超时时长。 |
| **`endpoint-independent-nat`** | 布尔值 | 可选 | `false` | 是否开启 Full-cone NAT (全锥型 NAT)，改善 P2P 连通率。 |
| **`route-table`** | 整数 (u32) | 可选 | `2468` | **Linux 专属**。策略路由表索引 (别名: `iproute2-table-index`)。 |
| **`iproute2-rule-index`** | 整数 (u32) | 可选 | `8964` | **Linux 专属**。策略路由规则优先级序号。 |

---

## 枚举类配置全集说明

### `stack` (网络协议栈实现)

| 可选枚举值 | 兼容别名 | 说明 |
| :--- | :--- | :--- |
| **`system`** (默认推荐) | 无 | **操作系统原生内核网络栈**。利用内核 TCP-NAT 回环机制与零拷贝用户态 UDP 实现，吞吐量最高、CPU 消耗极低，全平台首选。 |
| **`smoltcp`** | `gvisor` | **纯用户态网络协议栈**。基于 Rust `smoltcp` 库独立维护 TCP 连接与重组，具备优秀的沙盒隔离性和跨平台一致性。旧配置中的 `gvisor` 会作为兼容别名自动映射为此模式。 |
| **`mixed`** | 无 | 混合模式（行为等同于 `system`）。 |
