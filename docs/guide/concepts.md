# 流量如何经过 Clash-rs

使用 Clash-rs 时，先让应用流量进入代理，再通过规则决定走哪个节点、直接连接还是阻止访问。下面介绍配置中几个常见概念。

---

## 流量处理过程

```mermaid
flowchart LR
    subgraph Inbound [入站层 (Inbounds)]
        HTTP[HTTP/SOCKS5]
        TUN[TUN 虚拟网卡]
        EBPF[eBPF 内核拦截]
        TPROXY[TProxy / Redir]
    end

    subgraph Core [路由与核心分流]
        SNIFFER[域名嗅探 Sniffer]
        DNS[DNS / DNS2 引擎]
        RULES[Rules 规则引擎]
    end

    subgraph Outbound [出站层 (Outbounds)]
        GROUP[策略组 Proxy Groups]
        NODE[出站节点 Proxies]
        DIRECT[DIRECT 直连]
        REJECT[REJECT 丢弃]
    end

    Inbound --> SNIFFER
    SNIFFER --> DNS
    DNS --> RULES
    RULES --> GROUP
    GROUP --> NODE
    GROUP --> DIRECT
    GROUP --> REJECT
```

---

## 1. 入站层 (Inbounds)

流量进入 `clash-rs` 的途径，支持两大类：

1. **应用层显式代理**：
   - `HTTP` / `SOCKS5` / `mixed-port`：应用程序主动配置代理端口。
   - `Shadowsocks` / `AnyTLS`：作为服务端接收外部客户端接入。
2. **系统级透明代理**：
   - `TUN`：创建系统虚拟网卡并接管默认路由，无需逐个应用配置代理。
   - `eBPF`：在 Linux 上接管应用流量，并加速符合直连规则的连接。
   - `TProxy` / `Redir`：传统的 Linux iptables / nftables 透明代理模式。

---

## 2. 域名嗅探层 (Sniffer)

在透明代理（TUN / eBPF / TProxy）模式下，客户端发起连接的目标往往只是一个目标 IP（尤其是通过 Fake-IP 或直接 IP 连接）。

开启域名嗅探后，Clash-rs 会尝试从 HTTP、HTTPS 和 QUIC 连接中识别访问的域名，让这些连接也能按网站规则分流。能否识别取决于连接是否包含可读取的域名信息。

---

## 3. DNS 与 更灵活的 DNS2 引擎

DNS 用于把网站域名转换为连接地址。你可以选择合适的 DNS 服务，并让不同网站使用不同的解析方式：

- **传统 DNS 引擎 (`dns:`)**：采用常见的 `nameserver`、`fallback`、`fake-ip` 与 `nameserver-policy` 策略，适合绝大多数标准场景。
- **更灵活的 DNS2 引擎 (`dns2:`)**：可以按查询的域名和返回的结果选择 DNS 服务，也可以指定通过哪个代理发送查询；适合需要更细致 DNS 分流的场景。

---

## 4. 规则引擎 (Rules)

当连接信息（源 IP、目标 IP、目标端口、进程名称、域名、入站类型）收集齐全后，流量按自上而下的顺序在 `rules` 中进行逐条匹配：

- 命中第一条规则时立即终止匹配，并交由该规则指定的出站目标（例如特定节点、策略组、`DIRECT` 或 `REJECT`）。
- 若所有规则均未命中，则落入兜底的 `MATCH` 规则。

---

## 5. 出站层 (Outbounds) 与策略组

出站层负责最终将流量安全送出：

- **代理协议**：支持 Shadowsocks、AnyTLS、Hysteria2、TUIC、VLESS、VMess、Trojan、WireGuard 等，各协议的功能和配置见 [出站协议总览](/configuration/proxies)。VLESS 支持 REALITY、Encryption 和 XHTTP。
- **策略组 (Proxy Groups)**：
  - `select`：手动选择节点；
  - `url-test`：自动测速并切换到延迟最低的节点；
  - `fallback`：主备容灾切换；
  - `load-balance`：负载均衡轮询；
  - `relay`：多节点链式中继代理；
  - `smart`：根据统计数据智能选择最佳出站。
