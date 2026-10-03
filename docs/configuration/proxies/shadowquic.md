# ShadowQUIC

ShadowQUIC 支持 TCP/UDP，使用用户名、密码和 JLS 服务端名称认证。节点类型为 `shadowquic`，当前不支持前置代理 `connect-via`。

## 示例

```yaml
proxies:
  - name: ShadowQUIC-Node
    type: shadowquic
    server: sq.example.com
    port: 443
    username: example-user
    password: example-password
    server-name: jls.example.com
    alpn: [h3]
    congestion-control: bbr
    zero-rtt: true
    over-stream: false
    initial-mtu: 1300
    min-mtu: 1290
    mtu-discovery: true
```

## 字段

`username`、`password`、`server-name` 必填；`server-name` 与服务端 JLS 上游名称一致，不能用其他协议的 `sni` 字段代替。

| 字段 | 说明 |
| --- | --- |
| `alpn` | 默认 `[h3]`，与服务端保持一致 |
| `congestion-control` | `bbr`、`new-reno`、`cubic` |
| `zero-rtt` | 尝试缩短已有会话的重新连接时间，需要服务端支持 |
| `over-stream` | 是否通过持续数据流转发 UDP，按服务端要求设置 |
| `initial-mtu` / `min-mtu` | 至少 `1200`，初始值应大于最小值 |
| `keep-alive-interval` | 毫秒，`0` 关闭 keep-alive |
| `gso` | UDP 分段卸载 |
| `mtu-discovery` | 开启路径 MTU 发现，否则使用固定初始 MTU |

一般使用可以省略调优选项，保持默认设置。只有代理节点要求或排查连接问题时，再调整 MTU、心跳和拥塞控制。
