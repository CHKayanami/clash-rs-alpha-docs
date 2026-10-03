# VLESS

VLESS 支持多种传输和安全设置，可按代理节点的参数搭配 TLS、REALITY、Vision、Encryption 或 XHTTP。节点类型为 `vless`，支持 TCP/UDP，`udp` 默认开启。

## 基础配置

```yaml
proxies:
  - name: VLESS-WS
    type: vless
    server: vless.example.com
    port: 443
    uuid: 00000000-0000-0000-0000-000000000000
    tls: true
    server-name: vless.example.com
    network: ws
    ws-opts:
      path: /vless-ws
      headers:
        Host: vless.example.com
    udp: true
```

`uuid` 必填。`tls` 默认关闭；`server-name` 的别名是 `servername`，没有通用 `sni` 别名。支持 `network: tcp` / `raw` / `http` / `ws` / `h2` / `grpc` / `xhttp`；不填时使用默认连接方式。见 [传输与 TLS](./transport-security)。

| 字段 | 说明 |
| --- | --- |
| `encryption` | 省略、空字符串或 `none` 关闭；详见 [Encryption](./vless-encryption) |
| `flow` | `xtls-rprx-vision` 启用 Vision；按服务端配置省略或设置 |
| `alpn` | TLS / REALITY 应用协议列表；省略时按传输设置，XHTTP 另有 H2 限制 |
| `client-fingerprint` | 模拟 Chrome 浏览器的 TLS 握手；REALITY 默认启用 |
| `reality-opts` | 启用 REALITY 安全层，取代普通 TLS |
| `skip-cert-verify` | 普通 TLS 验证开关，默认 `false` |
| `tls-cert` / `tls-key` | 普通 TLS 的客户端证书与私钥，必须成对配置 |
| `smux` | [H2MUX](./multiplex)，不能与启用的 Encryption 同时使用 |

VLESS 节点没有 `fingerprint` 字段；不要复制 VMess/Trojan 的证书固定校验配置。XHTTP 独立下行端点有自己的 `fingerprint` 字段。

## REALITY 与 Vision

```yaml
proxies:
  - name: VLESS-REALITY
    type: vless
    server: reality.example.com
    port: 443
    uuid: 00000000-0000-0000-0000-000000000000
    network: tcp
    tls: true
    server-name: camouflage.example.com
    client-fingerprint: chrome
    flow: xtls-rprx-vision
    reality-opts:
      public-key: <REALITY_PUBLIC_KEY>
      short-id: "0123456789abcdef"
    udp: true
```

替换公钥为服务端的 32 字节 Base64URL 公钥，SNI 与服务端允许的名称一致。`short-id` 是十六进制，最多 8 字节，可省略或为空（需服务端允许）。

REALITY 可以单独使用。是否填写 `flow: xtls-rprx-vision` 取决于服务端设置；浏览器指纹默认开启，填写 `client-fingerprint: none` 可关闭。

未启用 Encryption 时，Vision 需要 TLS 或 REALITY；XHTTP 上的 Vision 必须搭配 Encryption。

## 扩展配置

- [VLESS Encryption](./vless-encryption)：内层加密与握手模式，独立于 TLS/REALITY。
- [XHTTP](./xhttp)：工作模式、独立下行、复用、请求设置和数据填充。
