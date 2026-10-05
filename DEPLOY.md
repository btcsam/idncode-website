# 部署到 idncode.com（GitHub + Cloudflare Pages）

代码仓库：<https://github.com/btcsam/idncode-website>
托管：Cloudflare Pages（Git 自动部署）→ 自定义域名 `idncode.com` 与 `www.idncode.com`

> 这条路线不需要 GitHub Actions、不需要构建命令、不需要任何 Secrets。
> Cloudflare 直接拉仓库里的静态文件，推送 `main` 就自动发布。

---

## 一、在 Cloudflare 创建 Pages 项目

1. 打开 <https://dash.cloudflare.com> → 左侧 **Workers & Pages** → **Create** → 选 **Pages** → **Connect to Git**
2. 授权 GitHub，选择仓库 **`btcsam/idncode-website`**
3. 构建设置按下面填（很容易填错，照抄即可）：

| 字段 | 填写内容 |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | **留空** |
| Build output directory | `site` |

> 关键点：Build command 必须留空。这是纯静态站，没有构建步骤；
> 输出目录填 `site`，因为仓库里 `site/` 才是网站根目录（`README.md` 在上一层）。

4. 点 **Save and Deploy**，约 30 秒后拿到一个 `*.pages.dev` 的临时地址。
   先打开它，确认和本地预览一致。

## 二、绑定 idncode.com

1. Pages 项目 → **Custom domains** → **Set up a custom domain**
2. 输入 `idncode.com` → 继续。因为你的域名就在同一个 Cloudflare 账号里，
   它会自动写好 DNS 记录（`CNAME`/`A` + 代理开启），**不要手动去改**。
3. 再重复一次，输入 `www.idncode.com`。
4. 等状态变成 **Active**（通常 1–5 分钟），SSL 证书自动签发。

Cloudflare 会自动处理：
- 把 `www` 或根域其中之一设为规范域名，另一条自动 301 跳转
- 强制 HTTPS、HSTS（`site/_headers` 里已声明）

## 三、可选但建议做

| 项目 | 位置 | 说明 |
| --- | --- | --- |
| Always Use HTTPS | SSL/TLS → Edge Certificates | 打开，避免 http 可访问 |
| Automatic HTTPS Rewrites | 同上 | 打开 |
| Speed → Optimization | Brotli 打开 | 静态站收益明显 |
| Web Analytics | 免费开启 | 不依赖 Cookie，比 GA 轻 |
| 缓存规则 | Caching → Rules | `site/_headers` 已经逐类声明，无需重复配置 |

## 四、以后每次更新网站

```bash
cd "/Users/sam/Documents/IDN Code/website"
git add -A && git commit -m "更新说明" && git push
```

推送后 Cloudflare 自动重新发布，约 20–40 秒生效。
其他分支的推送会生成独立的预览地址，不会影响正式站。

---

## 排查

**页面能开但样式全丢** → Build output directory 填错了，应该是 `site` 而不是仓库根。
改成 `site` 后重新部署。

**下载区一直显示「即将开放下载」** → 正常。`site/data/releases.json` 里所有平台
`available` 都是 `false`。等安装包上线，把 `status` 改成 `published`、给对应平台补上
`url` / `sha256` / `size` 再推送即可。

**custom domain 一直 Pending** → 检查域名是否和 Pages 项目在同一个 Cloudflare 账号；
若域名 NS 还没指向 Cloudflare（Registrar 里买的通常已经指好了），先在
**Websites → 添加站点** 把 `idncode.com` 接入。

**想换回手动 DNS** → 根域 `A` 记录指向 Pages 提供的地址、`www` 用 `CNAME`，
但走 Custom domains 更省事，证书和跳转都会自动维护。
