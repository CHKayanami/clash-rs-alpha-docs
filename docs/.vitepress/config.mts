import process from 'node:process'
import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Clash-rs 配置文档',
  description: '高性能 Rust 代理核心 clash-rs 完整配置与使用说明手册',
  base: process.env.BASE_PATH || '/',
  lastUpdated: true,
  cleanUrls: true,
  head: [
    ['link', { rel: 'icon', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
  ],
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Clash-rs 文档',
    nav: [
      { text: '起步指引', link: '/guide/getting-started' },
      {
        text: '配置手册',
        items: [
          { text: '配置总览', link: '/configuration/overview' },
          { text: '基础通用配置', link: '/configuration/general' },
          { text: '外部控制器 (API/Web)', link: '/configuration/external-controller' },
          { text: '传统 DNS 引擎', link: '/configuration/dns' },
          { text: '更灵活的DNS ⚡', link: '/configuration/dns2' },
          { text: '多协议入站 & Listeners', link: '/configuration/inbounds' },
          { text: 'TUN 虚拟网卡接管', link: '/configuration/tun' },
          { text: 'eBPF 内核线速代理 ⚡', link: '/configuration/ebpf' },
          { text: '域名嗅探 (Sniffer)', link: '/configuration/sniffer' },
          { text: '出站代理 (Proxies)', link: '/configuration/proxies' },
          { text: '策略组 (Proxy Groups)', link: '/configuration/proxy-groups' },
          { text: '规则系统 (Rules)', link: '/configuration/rules' },
          { text: '订阅与规则集', link: '/configuration/proxy-providers' },
          { text: '缓存与geo数据', link: '/configuration/profile-and-databases' },
        ]
      },
      {
        text: '实战范例',
        items: [
          { text: '极简分流配置', link: '/examples/minimal' },
          { text: '旁路透明代理实战', link: '/examples/transparent-proxy' },
          { text: '全配置参考模板', link: '/examples/full-template' },
        ]
      },
      {
        text: '源码仓库',
        link: 'https://github.com/CHKayanami/clash-rs'
      }
    ],

    sidebar: [
      {
        text: '🚀 起步与架构',
        items: [
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '核心概念与架构', link: '/guide/concepts' },
        ]
      },
      {
        text: '⚙️ 核心配置手册',
        items: [
          { text: '配置总览与速查', link: '/configuration/overview' },
          { text: '基础通用配置 (General)', link: '/configuration/general' },
          { text: '外部控制器 (External Controller)', link: '/configuration/external-controller' },
          { text: '传统 DNS 引擎 (DNS)', link: '/configuration/dns' },
          { text: '更灵活的DNS (DNS2) ⚡', link: '/configuration/dns2' },
          { text: '入站协议与 Listeners', link: '/configuration/inbounds' },
          { text: 'TUN 虚拟网卡接管', link: '/configuration/tun' },
          { text: 'eBPF 内核透明代理 ⚡', link: '/configuration/ebpf' },
          { text: '域名嗅探 (Domain Sniffer)', link: '/configuration/sniffer' },
          { text: '出站代理节点 (Proxies)', link: '/configuration/proxies' },
          { text: '策略组 (Proxy Groups)', link: '/configuration/proxy-groups' },
          { text: '代理提供者 (Proxy Providers)', link: '/configuration/proxy-providers' },
          { text: '分流规则 (Rules)', link: '/configuration/rules' },
          { text: '规则提供者 (Rule Providers)', link: '/configuration/rule-providers' },
          { text: '缓存与geo数据 (Profile & Geo)', link: '/configuration/profile-and-databases' },
        ]
      },
      {
        text: '💡 实战配置模板',
        items: [
          { text: '极简可用配置', link: '/examples/minimal' },
          { text: '旁路由透明代理 (TUN / eBPF)', link: '/examples/transparent-proxy' },
          { text: '全配置参考模板', link: '/examples/full-template' },
        ]
      }
    ],

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档'
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭'
                }
              }
            }
          }
        }
      }
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/CHKayanami/clash-rs' }
    ],

    outline: {
      level: [2, 3],
      label: '本页导航'
    },

    editLink: {
      pattern: 'https://github.com/CHKayanami/clash-rs-alpha-docs/blob/main/docs/:path',
      text: '在 GitHub 上查看源码'
    },

    footer: {
      message: '基于 Rust 构建的高性能、现代网络分流代理核心',
      copyright: 'Copyright © 2024-PRESENT Clash-rs Contributors'
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },

    darkModeSwitchLabel: '深浅模式',
    lightModeSwitchTitle: '切换为浅色模式',
    darkModeSwitchTitle: '切换为深色模式',
    sidebarMenuLabel: '目录菜单',
    returnToTopLabel: '返回顶部'
  }
})
