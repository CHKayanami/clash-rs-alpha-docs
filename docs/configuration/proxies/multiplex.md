# H2MUX 连接复用

连接复用让多个请求共用已有连接，减少反复建连。SS、Trojan、VMess 和未启用 Encryption 的 VLESS 可以使用 H2MUX，服务端也必须支持这项功能。

## 开启方式

在节点中添加以下设置，`smux` 也可写成 `multiplex`：

```yaml
smux:
  enable: true
  protocol: h2mux
```

当前只支持 `protocol: h2mux`，不能改成 `smux` 或 `yamux`。不填写 `enable` 时默认关闭。

## 可选调整

一般使用可以保留默认值。需要限制连接数量或同时承载的请求数时再调整：

| 字段 | 默认 / 用途 |
| --- | --- |
| `max-connections` | `4`，最多建立多少条复用连接；填 `0` 也使用默认值 |
| `min-streams` | `4`，已有连接达到此请求数量后，允许增加连接；填 `0` 使用默认值 |
| `max-streams` | `0`，不主动限制每条连接的请求数，服务端的限制仍然有效 |
| `padding` | `false`，添加额外填充，需要服务端支持 |

## 哪些节点不需要这个开关

- AnyTLS 自带连接复用，直接调整其会话选项即可。
- XHTTP 使用 `reuse-settings`，见 [XHTTP](./xhttp)。
- SOCKS5 当前不支持 H2MUX。
- VLESS 启用了 Encryption 时，不能同时开启 `smux`。
