# 外部控制器与面板 (External Controller & Dashboard)

`clash-rs` 提供了兼容标准 Clash RESTful API 的外部控制接口，支持进行动态节点切换、实时测速、查看流量连接状态以及热重载配置。

最重要的是，**`clash-rs` 二进制可执行文件直接内置了现代化官方 Web 控制面板**，无需联网下载任何前端包，开箱即用！

---

## 🌟 强烈推荐：使用官方内置面板 (Embedded Dashboard)

`clash-rs` 默认将官方精心打造的现代化面板（基于 React 19、TailwindCSS 与 uPlot 高性能图表）通过静态嵌入技术打包在单二进制文件中。

### 最简开启方式 (零额外配置)

只需配置 `external-controller`，**完全无需配置 `external-ui`**：

```yaml
# 开启 RESTful API 控制器
external-controller: 127.0.0.1:9090

# 访问密钥（可选，推荐配置）
secret: "my_secure_api_token"
```

启动 `clash-rs` 后，直接在浏览器中打开：

👉 **`http://127.0.0.1:9090/ui`**

即可瞬间浏览界面！若配置了 `secret`，在首次打开时输入密钥即可完成连接。

### 内置面板的显著优势
1. **零网络依赖与秒级加载**：无需在启动时从 GitHub 缓慢拉取动辄数十兆的第三方 ZIP 压缩包，完全避免了由于网络受阻导致启动卡顿或下载失败的问题。
2. **深度契合与极致性能**：内置支持 Sankey 流量拓扑流向图、基于 uPlot 的毫秒级带宽实时折线图与连接追踪，资源开销极低。
3. **免维护**：随 `clash-rs` 二进制一同编译发布，永远保持与当前版本 API 契合，无需手动管理静态文件路径。

---

## 字段规格全览表

| 配置字段 | 类型 | 是否必填 | 默认值 | 详细说明与取值 |
| :--- | :--- | :--- | :--- | :--- |
| **`external-controller`** | 字符串 (`IP:Port`) | 可选 | 无 (不开启) | 外部控制 RESTful HTTP API 的监听地址，如 `127.0.0.1:9090` 或 `0.0.0.0:9090`。未配置时将不启动 HTTP 控制接口与 Web 面板。 |
| **`secret`** | 字符串 | 可选 | `""` (无密码) | API 访问认证密钥 (Bearer Token)。当监听在非 127.0.0.1 地址时**强烈建议配置**。客户端请求需在 Header 中附带 `Authorization: Bearer <secret>`。 |
| **`external-ui`** | 字符串 (目录路径) | 可选 | 无 (使用内置面板) | **外部自定义面板静态目录路径**。省略此项时，核心将**默认挂载官方内置面板**；配置此项后，将覆盖内置面板改用本地该目录下的网页文件。 |
| **`external-ui-url`** | 字符串 (URL) | 可选 | 无 | 自定义第三方 Web UI 静态压缩包（支持 `.zip` 与 `.tgz`）的自动下载地址。仅当配置了 `external-ui` 且该目录为空时生效。支持 `#force=true` 强制覆盖更新及 `#_clash_outbound=<节点名>` 指定代理下载。 |
| **`external-controller-unix`** | 字符串 (文件路径) | 可选 | 无 (不开启) | **Linux / macOS 专属**。通过 Unix Domain Socket 本地文件暴露控制接口（如 `/tmp/clash-rs.sock`），适合同机进程安全通信。 |
| **`external-controller-pipe`** | 字符串 (管道名称) | 可选 | 无 (不开启) | **Windows 专属**。通过 Windows 命名管道暴露控制接口（如 `\\.\pipe\clash-rs`），与 Unix Socket 作用对等。 |
| **`cors-allow-origins`** | 字符串列表 | 可选 | `["*"]` | RESTful API 允许跨域请求的 Origin 白名单域名列表。默认允许所有来源（`"*"`）。 |

---

## 自定义第三方外部面板 (可选)

如果你有使用其它第三方面板（如 Metacubexd、Yacd）的习惯，可通过显式声明 `external-ui` 进行覆盖替换：

::: warning 覆盖说明
一旦显式配置了 `external-ui`，`clash-rs` 将**不再展示内置面板**，转为读取该路径下的静态文件。若要重新恢复使用内置面板，只需将 `external-ui` 字段注释或删除即可。
:::

::: code-group

```yaml [官方内置面板 (默认推荐)]
external-controller: 127.0.0.1:9090
secret: "my_token"
# 无需配置 external-ui，直接访问 http://127.0.0.1:9090/ui
```

```yaml [自定义使用 MetaCubeX 面板]
external-controller: 127.0.0.1:9090
secret: "my_token"
external-ui: metacubexd
external-ui-url: "https://github.com/MetaCubeX/metacubexd/archive/refs/heads/gh-pages.zip"
```

```yaml [自定义使用 YACD 面板]
external-controller: 127.0.0.1:9090
secret: "my_token"
external-ui: yacd
external-ui-url: "https://github.com/haishanh/yacd/archive/gh-pages.zip"
```

:::
