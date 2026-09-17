# 代理提供者 (Proxy Providers)

`proxy-providers` 允许你以模块化的方式动态加载本地或远端 HTTP 订阅的代理节点列表，实现订阅的定时自动更新、正则筛选与自动化健康检查。

---

## 完整配置速查示例

```yaml
proxy-providers:
  # 远程 HTTP 订阅
  airport-sub:
    type: http
    url: "https://example.com/api/v1/client/subscribe?token=your_token"
    interval: 86400           # 24 小时自动更新一次
    path: ./providers/sub.yaml # 可选：本地缓存路径（省略则自动使用 URL MD5 缓存）
    proxy: DIRECT             # 可选：下载该订阅所走的出站代理（默认 DIRECT）
    headers:                  # 可选：自定义 HTTP 请求头
      User-Agent: ["clash-rs"]
    health-check:
      enable: true
      url: "http://www.gstatic.com/generate_204"
      interval: 300
      lazy: true

  # 本地文件订阅
  local-nodes:
    type: file
    path: ./my-nodes.yaml
    interval: 3600
    health-check:
      enable: true
      url: "http://www.gstatic.com/generate_204"
      interval: 600
```

::: tip 💡 节点筛选的最佳实践：使用策略组 `filter`
在 `clash-rs` 中，推荐在 **[策略组 (Proxy Groups)](/configuration/proxy-groups#节点过滤与空节点兜底机制-filter-empty-fallback)** 中使用 `filter` 与 `empty-fallback` 对提供者引入的节点进行区域过滤（如筛选香港、日本、美国节点）与空节点安全兜底。这种方式允许多个不同用途的策略组共享同一份订阅源，内存与解析开销最小。
:::

---

## 字段规格全览表

| 配置字段 | 类型 | 是否必填 | 默认值 | 详细说明与取值 |
| :--- | :--- | :--- | :--- | :--- |
| **`type`** | **枚举字符串** | **必填** | 无 | 提供者类型枚举，可选值：<br>• **`http`**：远程 HTTP / HTTPS 订阅链接；<br>• **`file`**：本地 YAML 节点文件。 |
| **`url`** | 字符串 (URL) | `type: http` 时**必填** | 无 | 远程订阅下载地址。 |
| **`path`** | 字符串 (文件路径) | 可选 | URL MD5 自动派生 | 本地缓存文件写入/读取路径（相对于工作目录）。若省略，核心将自动使用 URL 的 MD5 哈希生成内部缓存。 |
| **`interval`** | 整数 (秒) | 可选 | `0` (不自动重刷) | 自动检查并重新拉取最新订阅的间隔时间（如 `86400` 为 24 小时）。 |
| **`proxy`** | 字符串 | 可选 | `DIRECT` | 下载该订阅时指定的出站代理节点或策略组名称。 |
| **`headers`** | 键值映射 (字符串: 列表) | 可选 | `{}` | 请求远程订阅时携带的自定义 HTTP 报头（别名: `header`）。 |
| **`health-check`** | 复合对象 | 可选 | 无 | 自动化连通性探测与延迟健康检查配置，详见下文。 |

---

## 健康检查规格 (`health-check:`)

| 字段 | 类型 | 是否必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| **`enable`** | 布尔值 | 可选 | `false` | 是否为此提供者内的节点启用定时健康检查。 |
| **`url`** | 字符串 (URL) | `enable: true` 时必填 | 无 | 测速检测的目标 HTTP/HTTPS URL（推荐使用 Google 204 或 Cloudflare trace）。 |
| **`interval`** | 整数 (秒) | `enable: true` 时必填 | 无 | 健康检测探测执行周期。 |
| **`lazy`** | 布尔值 | 可选 | `false` | 是否开启懒检测（当前订阅内的节点若未被任何策略组使用或长时间无流量，暂停探测以节省带宽）。 |
