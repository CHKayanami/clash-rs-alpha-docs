# Shadowsocks

Shadowsocks 是常用的加密代理，支持网页、下载及需要 UDP 的应用。节点类型为 `ss`，也接受 `shadowsocks`。

## 基础配置

```yaml
proxies:
  - name: SS-Node
    type: ss
    server: ss.example.com
    port: 8388
    cipher: aes-256-gcm
    password: example-password
    udp: true
```

`cipher` 和 `password` 必填，`udp` 默认 `true`。常用加密方式包括 `aes-128-gcm`、`aes-256-gcm`、`chacha20-ietf-poly1305`。支持 `connect-via` 和 `tfo`。

## SS2022

```yaml
proxies:
  - name: SS2022-Node
    type: ss
    server: ss.example.com
    port: 8390
    cipher: 2022-blake3-aes-256-gcm
    password: <BASE64_KEY>
    udp: true
```

将占位符替换为代理节点配置中的密钥。SS2022 需要专用密钥，不能随意填写普通密码；多用户节点请保留代理节点配置中的完整密钥内容。

## UDP over TCP

节点中设置 `udp-over-tcp: true`，别名 `uot`。当前使用 UOT v2，服务端也必须支持 UOT v2；它将 UDP 包承载在 TCP 流上，与普通 SS UDP 转发不同。

## 插件

通过 `plugin` 和 `plugin-opts` 配置，用于连接要求这些插件的服务端。

::: code-group

```yaml [Simple-obfs]
plugin: obfs
plugin-opts:
  mode: http
  host: obfs.example.com
```

```yaml [v2ray-plugin WebSocket + TLS]
plugin: v2ray-plugin
plugin-opts:
  mode: websocket
  host: ws.example.com
  path: /ss-ws
  tls: true
  skip-cert-verify: false
```

```yaml [ShadowTLS]
plugin: shadow-tls
plugin-opts:
  host: camouflage.example.com
  password: example-shadowtls-password
  strict: true
```

:::

`obfs` 支持 `http` / `tls`，已弃用，建议优先使用代理节点支持的其他方案；obfs-tls 不是普通 TLS 安全层。`v2ray-plugin` 当前只支持 `mode: websocket`，`tls` 默认 `false`。插件字段不能与其他协议的 `network` 混用。

支持 [H2MUX](./multiplex)，需要服务端配套支持。
