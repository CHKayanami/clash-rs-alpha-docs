# Tailscale

Tailscale 节点用于访问 Tailscale 网络中的设备和服务，支持 TCP/UDP。节点类型为 `tailscale`，不需要填写代理服务器 `server` / `port`。

## 示例

```yaml
proxies:
  - name: Tailscale-Node
    type: tailscale
    auth-key: <AUTH_KEY>
    hostname: clash-agent
    state-dir: /path/to/tailscale-state
    ephemeral: false
```

## 字段

| 字段 | 默认 / 说明 |
| --- | --- |
| `name` | 必填 |
| `auth-key` | 可选，Tailscale 认证 key；替换示例占位符 |
| `hostname` | 可选，请求的设备主机名 |
| `state-dir` | 可选，保存设备身份状态 |
| `control-url` | 可选，自定义控制服务器 URL |
| `client-name` | 可选，控制面客户端标识 |
| `ephemeral` | 默认关闭；开启后不保存设备身份 |

希望重启后继续使用同一个设备身份时，保留 `ephemeral: false` 并填写 `state-dir`。临时使用可以开启 `ephemeral`；临时设备何时从管理后台清除，取决于 Tailscale 的设置。

UDP 默认可用，无需设置 `udp`。能访问哪些设备和网络由 Tailscale 的路由与访问权限决定；不需要配置 TLS 或 `smux`，也不支持前置代理。
