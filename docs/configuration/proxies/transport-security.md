# 传输方式、TLS 与浏览器指纹

节点的传输方式和安全设置要与服务端一致。通常直接使用代理节点的配置，不需要自行组合。

## 传输方式怎么选

`network` 决定节点使用哪种方式传输数据：

| 协议 | 可选的 `network` |
| --- | --- |
| VLESS | `tcp`、`raw`、`http`、`ws`、`h2`、`grpc`、`xhttp` |
| VMess | `tcp`、`http`、`ws`、`h2`、`grpc` |
| Trojan | `tcp`、`ws`、`grpc` |

不填写时使用该协议的默认方式。WebSocket、HTTP、H2、gRPC 和 XHTTP 是不同的传输方式，不能只改名称就互相替换。Shadowsocks 的插件设置见 [Shadowsocks](./shadowsocks)。

### WebSocket

代理节点使用 WebSocket 时，填写 `network: ws` 和对应的路径：

```yaml
network: ws
ws-opts:
  path: /proxy-ws
  headers:
    Host: ws.example.com
```

`ws-opts` 必须填写。如果服务端支持握手时提前发送数据，还可以设置 `max-early-data` 和 `early-data-header-name`；不确定时省略。

### HTTP、H2 与 gRPC

::: code-group

```yaml [HTTP：VLESS / VMess]
network: http
http-opts:
  method: GET
  path: [/download, /video]
  headers:
    Host: [http.example.com]
```

```yaml [H2：VLESS / VMess]
network: h2
h2-opts:
  host: [h2.example.com]
  path: /proxy-h2
```

```yaml [gRPC：VLESS / VMess / Trojan]
network: grpc
grpc-opts:
  grpc-service-name: GunService
```

:::

H2 需要 `h2-opts`，gRPC 需要 `grpc-opts`。路径、Host 和服务名都按服务端提供的值填写。XHTTP 的设置另见 [XHTTP](./xhttp)。

## TLS：加密连接并验证服务器

TLS 用来保护到服务器的连接。VLESS、VMess 和 SOCKS5 按需设置 `tls: true`；Trojan、AnyTLS 始终使用 TLS；Hysteria2、TUIC 不需要额外打开此开关。

### 服务器名称

服务器名称用于 TLS 握手和证书验证，通常填写代理节点配置中的域名：

| 协议 | 字段名 |
| --- | --- |
| VLESS、VMess | `server-name`，也可写 `servername` |
| Trojan、AnyTLS、SOCKS5、Hysteria2、TUIC | `sni` |

不要把不同协议的字段名混用。例如 VLESS 使用 `server-name`，不能直接改写成 `sni`。

`skip-cert-verify` 默认关闭。只有需要跳过服务器证书检查时才设为 `true`；普通节点保持默认即可。

### ALPN

`alpn` 用于与服务端协商连接使用的应用协议，一般保留默认值。VLESS、Trojan、AnyTLS、Hysteria2 和 TUIC 支持自定义；VMess 自动按传输方式选择，SOCKS5 无需配置。

XHTTP 使用 `stream-one` 或搭配 REALITY 时需要支持 `h2`，详见 [XHTTP](./xhttp)。

## 浏览器指纹

`client-fingerprint` 让 TLS 握手呈现浏览器的特征。VLESS、VMess、Trojan 和 AnyTLS 支持，常用设置是：

```yaml
client-fingerprint: chrome
```

当前使用 Chrome 风格的指纹。`utls` 和其他浏览器名称也会使用这一风格，不会切换为独立的 Firefox 或 Safari 指纹。

普通 TLS 不填写时不启用浏览器指纹，设置 `none` 可关闭。REALITY 默认启用，设为 `none` 后仍可使用 REALITY。

## 固定服务器证书

`fingerprint` 用来确认连接的是指定证书的服务器，与 `client-fingerprint` 是两个不同的选项。VMess、Trojan、AnyTLS、Hysteria2，以及 XHTTP 的独立下载端点支持它；VLESS 主节点和 SOCKS5 不支持。

填写服务器证书的 SHA-256 指纹：连续的 64 位十六进制字符，不加 `sha256/` 前缀。可以从代理节点配置中获取，也可以从证书文件计算：

```sh
openssl x509 -in server.crt -outform DER | openssl dgst -sha256
```

复制输出中的十六进制摘要。它是整张证书的指纹，不是公钥指纹；服务器更换证书后需要更新。

## 客户端证书认证

服务端要求客户端证书时，配置证书和私钥。两项必须一起填写，可以使用文件路径或证书内容：

```yaml
tls-cert: /path/to/client.crt
tls-key: /path/to/client.key
```

VLESS 普通 TLS、VMess、Trojan、AnyTLS、Hysteria2 和 TUIC 支持此功能；SOCKS5 不支持。XHTTP 独立下载端点使用 `certificate` / `private-key`，见其专页。REALITY 不使用这组客户端证书。

`ca` / `ca-str` 不是通用选项，当前也不能用于 Hysteria2 的自定义 CA 配置。
