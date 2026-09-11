# 核心概念与架构

深入理解 **clash-rs** 的内部架构与流量流动模型，能帮助你更精确地调优配置并排查网络问题。

---

## 整体数据流向拓扑

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
   - `TUN`：创建系统虚拟网卡并接管默认路由（支持 gVisor 用户态栈或 System 内核栈）。
   - `eBPF`：在 Linux 内核层利用 TC (Traffic Control) 拦截入站与出站，具备直连快路径免用户态拷贝能力。
   - `TProxy` / `Redir`：传统的 Linux iptables / nftables 透明代理模式。

---

## 2. 域名嗅探层 (Sniffer)

在透明代理（TUN / eBPF / TProxy）模式下，客户端发起连接的目标往往只是一个目标 IP（尤其是通过 Fake-IP 或直接 IP 连接）。

`clash-rs` 内置的高性能 Sniffer 会在 TCP 握手完成后的首个应用层数据包中，以**零拷贝**方式提取真实的域名：
- **TLS SNI**：解析 Client Hello 中的 Server Name Indication；
- **HTTP Host**：解析 GET/POST 等 HTTP 请求头中的 Host 字段；
- **QUIC SNI**：解析 UDP QUIC Initial 数据包中的域名信息。

提取域名后，该连接会重新由域名规则（`DOMAIN`, `DOMAIN-SUFFIX` 等）进行高精度匹配。

---

## 3. DNS 与 更灵活的 DNS2 引擎

DNS 在现代代理体系中至关重要，负责解决 DNS 污染并提供 Fake-IP 映射：

- **传统 DNS 引擎 (`dns:`)**：采用常见的 `nameserver`、`fallback`、`fake-ip` 与 `nameserver-policy` 策略，适合绝大多数标准场景。
- **更灵活的 DNS2 引擎 (`dns2:`)**：全新的基于路由规则的 DNS 架构。将每个 DNS 上游赋予独立的 `tag`，支持为上游绑定 `detour`（穿透特定代理节点解析），并通过 `request` / `response` 规则在请求发起前和响应收到后分别执行细粒度路由策略。

---

## 4. 规则引擎 (Rules)

当连接信息（源 IP、目标 IP、目标端口、进程名称、域名、入站类型）收集齐全后，流量按自上而下的顺序在 `rules` 中进行逐条匹配：

- 命中第一条规则时立即终止匹配，并交由该规则指定的出站目标（例如特定节点、策略组、`DIRECT` 或 `REJECT`）。
- 若所有规则均未命中，则落入兜底的 `MATCH` 规则。

---

## 5. 出站层 (Outbounds) 与策略组

出站层负责最终将流量安全送出：

- **代理协议**：支持 Shadowsocks、AnyTLS、Hysteria2、TUIC、VLESS、VMess、Trojan、WireGuard 等。
- **策略组 (Proxy Groups)**：
  - `select`：手动选择节点；
  - `url-test`：自动测速并切换到延迟最低的节点；
  - `fallback`：主备容灾切换；
  - `load-balance`：负载均衡轮询；
  - `relay`：多节点链式中继代理；
  - `smart`：根据统计数据智能选择最佳出站。
