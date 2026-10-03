---
layout: home

hero:
  name: "Clash-rs"
  text: "Clash-rs 使用与配置手册"
  tagline: "按网站和应用选择代理，支持多种节点协议、自动切换与透明代理"
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
    title: 稳定高效的代理核心
    details: 面向日常浏览、下载和多设备联网，提供灵活的流量分流与连接管理。
  - icon: ⚡
    title: Linux 透明代理加速
    details: 在 Linux 上接管应用流量，并加速符合直连规则的连接。
  - icon: 🎯
    title: 灵活的 DNS 分流
    details: 按域名和解析结果选择 DNS 服务，也可让 DNS 查询经过指定代理。
  - icon: 🔍
    title: 自动识别访问域名
    details: 从支持的连接中识别网站域名，让透明代理也能按域名规则分流。
  - icon: 🌐
    title: TUN 透明代理
    details: 接管设备的网络流量，无需逐个应用设置代理；按操作系统配置虚拟网卡和路由。
  - icon: 📦
    title: 现代协议与订阅生态
    details: 支持 Shadowsocks、AnyTLS、Hysteria2、TUIC、VLESS、VMess、Trojan 等节点，以及 VLESS 的 REALITY、Encryption 和 XHTTP；可自动更新节点订阅与规则。
---

<style>
:root {
  --vp-home-hero-image-filter: drop-shadow(0 0 40px rgba(230, 81, 0, 0.4));
}
</style>
