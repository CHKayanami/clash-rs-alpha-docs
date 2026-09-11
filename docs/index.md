---
layout: home

hero:
  name: "Clash-rs"
  text: "高性能 Rust 代理核心配置手册"
  tagline: "极速、低内存占用、支持 eBPF 内核加速与更灵活的DNS路由的多协议分流代理"
  image:
    src: /logo.svg
    alt: Clash-rs Logo
  actions:
    - theme: brand
      text: 快速开始起步 🚀
      link: /guide/getting-started
    - theme: alt
      text: 配置参数速查 ⚙️
      link: /configuration/overview
    - theme: alt
      text: 更灵活的DNS ⚡
      link: /configuration/dns2

features:
  - icon: 🦀
    title: 纯 Rust 高性能实现
    details: 基于 Tokio 异步网络运行时与 Rust 内存安全特性，零 GC 停顿，资源占用极低，长效稳定运行。
  - icon: ⚡
    title: eBPF 内核态线速透明代理
    details: 支持 Linux eBPF TC 与 Cgroup 拦截，内核态直连快路径决策 (Direct Offload)，绕过用户态损耗。
  - icon: 🎯
    title: 更灵活的DNS (DNS2) 引擎
    details: 独立创新的 Router DNS 架构，支持请求与响应双向规则分流、独立 Fake-IP 池与 Upstream 策略 Detour。
  - icon: 🔍
    title: 高性能首包域名嗅探
    details: 零拷贝解析 TLS SNI、HTTP Host 与 QUIC Initial SNI，让透明代理流量获得无缝的精确域名规则匹配。
  - icon: 🌐
    title: 全协议与全平台 TUN 接管
    details: 支持 gVisor 与 System 双协议栈 TUN 驱动，覆盖 Linux、macOS、Windows 与移动平台。
  - icon: 📦
    title: 现代协议与订阅生态
    details: 涵盖 Shadowsocks、AnyTLS、Hysteria2、TUIC、VLESS (REALITY)、VMess、Trojan，支持 Proxy/Rule-Providers 动态热更新。
---

<style>
:root {
  --vp-home-hero-image-filter: drop-shadow(0 0 40px rgba(230, 81, 0, 0.4));
}
</style>
