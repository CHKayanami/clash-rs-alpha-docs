# XHTTP

XHTTP 是 VLESS 的一种传输方式，支持上传与下载分开连接，也可以复用连接来减少建连次数。只有服务端提供了 XHTTP 节点时才使用它。当前支持 HTTP/1.1 和 HTTP/2，不支持 HTTP/3，也不能用于 Trojan 或 VMess。

## 基础配置

在 VLESS 节点中设置 `network: xhttp`，其他参数按服务端填写：

```yaml
proxies:
  - name: VLESS-XHTTP
    type: vless
    server: xhttp.example.com
    port: 443
    uuid: 00000000-0000-0000-0000-000000000000
    tls: true
    server-name: xhttp.example.com
    alpn: [h2]
    network: xhttp
    xhttp-opts:
      host: xhttp.example.com
      path: /xhttp
      mode: packet-up
```

- `server` / `port`：实际连接的服务器和端口。
- `server-name`：TLS 的服务器名称。
- `host`：HTTP 请求的域名；可以与连接地址不同，按代理节点配置中的值填写。
- `path`：XHTTP 路径，默认 `/`。

使用扁平的 `xhttp-opts` 配置。不要直接复制 Xray 的 `extra` 或驼峰字段名，也无需设置 `http-version`。

## 上传模式

一般使用服务端指定的模式；未指定时可以省略 `mode`，让 clash-rs 自动选择。

| `mode` | 用途与要求 |
| --- | --- |
| `packet-up` | 将上传数据拆成多次请求，下载单独进行；支持 HTTP/1.1 和 HTTP/2 |
| `stream-up` | 持续上传，下载单独进行；支持 HTTP/1.1 和 HTTP/2 |
| `stream-one` | 上传和下载共用一个双向请求；必须使用 HTTP/2，不能设置独立下载端点 |
| `auto` / 省略 | 自动选择：普通节点使用 `packet-up`；REALITY 使用 `stream-one`，设置独立下载端点后使用 `stream-up` |

普通 TLS 默认协商 `h2` 或 `http/1.1`。`stream-one` 和 REALITY 必须支持 `h2`，不能只填写 `alpn: [http/1.1]`。

XHTTP 可以搭配 [VLESS Encryption](./vless-encryption)。使用 Vision 时，必须同时开启 Encryption。

## 独立下载端点

代理节点使用不同的上传和下载地址时，使用 `download-settings`。没有这种需求就省略，上传和下载会使用同一端点。

```yaml
xhttp-opts:
  mode: stream-up
  path: /upload
  download-settings:
    server: download.example.com
    port: 8443
    host: cdn.example.com
    path: /download
    tls: true
    server-name: download.example.com
    alpn: [h2]
```

上传和下载地址必须由服务端配套提供，不能随意填写另一台服务器。没有单独填写的设置沿用主节点配置；`headers` 会整体替换，不会逐项合并。`stream-one` 不能配置独立下载端点。

<details>
<summary>下载端点的可选设置</summary>

| 字段 | 用途 |
| --- | --- |
| `server` / `port` | 下载服务器和端口 |
| `host` / `path` / `headers` | 下载请求的域名、路径和额外请求头 |
| `tls` / `reality-opts` | 下载连接的安全设置；主节点使用 REALITY 时不能用 `tls: false` 将其关闭 |
| `server-name` | TLS 服务器名称，也可写 `servername` |
| `alpn` | 使用的应用协议，通常按服务端要求填写 `[h2]` |
| `skip-cert-verify` | 是否跳过下载服务器的证书检查 |
| `fingerprint` | 下载服务器证书的 SHA-256 指纹 |
| `client-fingerprint` | 下载连接的浏览器指纹 |
| `certificate` / `private-key` | 服务端要求的客户端证书和私钥；两项一起填写 |
| `reuse-settings` | 下载连接的复用设置 |

</details>

## 连接复用

如果希望多个代理连接共用已有的 HTTP 连接，添加 `reuse-settings`。不设置时默认关闭跨连接复用；使用空配置即可开启：

```yaml
xhttp-opts:
  mode: packet-up
  path: /xhttp
  reuse-settings: {}
```

需要限制规模时，可以进一步设置：

```yaml
reuse-settings:
  max-concurrency: "16"
  max-connections: "2"
```

范围类参数要加引号，例如 `"16"` 或 `"8-16"`。它们控制连接复用的规模，实际网络连接数可能因上传下载分离和服务端限制而增加。

<details>
<summary>更多复用选项</summary>

| 字段 | 默认 / 用途 |
| --- | --- |
| `max-concurrency` | `"0"`，不主动限制每组复用连接同时承载的代理连接数 |
| `max-connections` | `"0"`，不主动限制复用规模，优先使用已有连接；设置正值后逐步增加到指定规模 |
| `c-max-reuse-times` | `"0"`，不限制再次使用的次数 |
| `h-max-request-times` | `"0"`，不限制每组连接接受的新代理连接数；不用于计算每次分片上传 |
| `h-max-reusable-secs` | `"0"`，不限使用时间；到期后不再接收新连接，已有传输继续完成 |
| `h-keep-alive-period` | 整数秒；`0` 使用 45 秒，`-1` 关闭心跳，正值指定心跳间隔 |

前五项使用字符串，可填写单值或范围。独立下载端点的复用设置单独计算，不与上传设置合并。

</details>

## 高级设置

普通节点通常不需要调整以下选项。只有代理节点明确要求时才修改；两端设置必须匹配。

<details>
<summary>上传大小、额外请求头与数据位置</summary>

| 字段 | 默认 / 用途 |
| --- | --- |
| `headers` | 额外请求头，值为字符串 |
| `no-grpc-header` | `false`；通常保留默认值，服务端要求时再关闭自动添加的请求类型标识 |
| `uplink-http-method` | `POST`；GET 上传仅适用于 packet-up，不支持 CONNECT/HEAD/TRACE/OPTIONS |
| `sc-max-each-post-bytes` | `"1000000"`，packet-up 每次上传请求的最大数据量（字节） |
| `sc-min-posts-interval-ms` | `"30"`，上传请求间隔（毫秒） |
| `session-placement` / `seq-placement` | `path`；也可使用 `query`、`header`、`cookie`，决定会话标识和分片序号放在哪里 |
| `session-key` / `seq-key` | 对应字段名；header 默认 `X-Session` / `X-Seq`，query/cookie 默认 `x_session` / `x_seq` |
| `session-table` / `session-length` | 自定义会话标识的字符和长度；一般省略即可 |
| `uplink-data-placement` | `body`；也可用 `header` / `cookie`，但仅适用于 packet-up |
| `uplink-data-key` | 数据字段名；header 默认 `X-Data`，cookie 默认 `x_data` |
| `uplink-chunk-size` | 字符串范围，控制上传分片大小；一般保留默认值 |

自定义字段名不能相互重复，额外请求头和 URL 参数也不能占用这些字段。

</details>

<details>
<summary>数据填充</summary>

填充可以改变请求的外观。按服务端提供的配置填写，不确定时保留默认值。

| 字段 | 默认 / 用途 |
| --- | --- |
| `x-padding-bytes` | `"100-1000"`，填充长度范围；最大值为 `0` 时使用默认范围 |
| `x-padding-obfs-mode` | `false`；开启后可使用以下自定义选项 |
| `x-padding-key` | `x_padding`，填充字段名 |
| `x-padding-header` | 自定义模式为 `X-Padding`，普通模式为 `Referer` |
| `x-padding-placement` | `queryInHeader`；也支持 `header`、`query`、`cookie` |
| `x-padding-method` | `repeat-x` 或 `tokenish`，按服务端要求选择 |

</details>
