# Clash-rs 配置说明文档网站

本项目是基于 [VitePress](https://vitepress.dev/) 构建的高性能 Rust 代理核心 **clash-rs** 的官方配置说明文档网站。

支持通过 GitHub Actions 自动编译并部署至 **GitHub Pages**。

---

## 本地开发

确保本地已安装 Node.js (>= 18)：

```bash
# 安装依赖
npm install

# 启动本地热重载开发服务器
npm run docs:dev
```

打开浏览器访问 `http://localhost:5173` 即可预览文档。

---

## 构建与生产预览

```bash
# 静态打包编译
npm run docs:build

# 本地预览编译生成的 dist 产物
npm run docs:preview
```

---

## 部署至 GitHub Pages

仓库已预置自动化工作流 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)。

当你将代码推送至 GitHub 仓库的 `main` 或 `master` 分支时，GitHub Actions 会自动触发构建并发布至 GitHub Pages。

**首次使用设置：**
1. 进入 GitHub 仓库设置：`Settings` -> `Pages`；
2. 在 **Build and deployment** -> **Source** 下拉框中，选择 **GitHub Actions**；
3. 后续每次 `git push` 即可全自动构建上线。
