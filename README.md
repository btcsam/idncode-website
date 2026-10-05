# IDN Code 官网设计与文案 · 学习参考（Make by IDN Code）

> ⚠️ **本仓库仅作学习参考，不是上线版本，请勿部署到 `idncode.com`。**
>
> 正式官网位于 **`btcsam/idn-code`** 仓库的 `site/` 目录（Cloudflare Workers 静态资源，
> 域名绑定写在该目录的 `wrangler.jsonc` 里）。本仓库是早期独立做的一版设计探索，
> 其中值得复用的部分（中英双语内容、下载区读版本清单的逻辑）已经并入正式站。
>
> 保留这个仓库的原因是：版式与文案组织的思路可以作为参考，但**不要再在这里改内容**，
> 否则两边会不一致。

结构与逻辑参考 idnclaw.com：同一套版式语言（深色 Hero + 白底卡片 + 滚动显现 + 三步上传 + 对比表 + 下载区），
主色由红粉改为 IDN Code 的品牌蓝体系（取自 App 图标的青蓝渐变）。

- 本仓库（参考版）：<https://github.com/btcsam/idncode-website>
- 正式站源码：`btcsam/idn-code` → `site/`
- 原计划的 Cloudflare Pages 部署流程见 [DEPLOY.md](./DEPLOY.md)（**已弃用**，仅作留档）

## 与正式站的差异（供对照）

| | 本仓库（参考） | 正式站 |
| --- | --- | --- |
| 语言实现 | `/en/` 独立英文页 + 语言切换链接 | `data-i18n` 逐节点替换 + localStorage 记忆 |
| 设计系统 | 自带 `css/site.css`，引用 Google Fonts | 复用 `styles.css` 的 CSS 变量，系统字体栈，不引外部资源 |
| 叙事 | "让 AI 真正上手工程"（代码为主） | "小思思有了自己的工作台"（文件与任务为主，代码是其中一个场景） |
| 安全头 | `site/_headers`（无 CSP） | 含 CSP 的完整安全头 |

## 目录结构

```
website/                  ← 仓库根目录
├── README.md             本文件：改文案、换素材看这里
├── DEPLOY.md             部署与域名绑定步骤
└── site/                 ← Cloudflare Pages 的输出目录
    ├── index.html            中文首页
    ├── privacy.html          中文隐私政策
    ├── terms.html            中文服务条款
    ├── en/
    │   ├── index.html        英文首页
    │   ├── privacy.html      英文隐私政策
    │   └── terms.html        英文服务条款
    ├── css/site.css          全站样式（含品牌色变量、响应式、动效）
    ├── js/site.js            交互：滚动显现、粒子、下载清单、订阅表单
    ├── js/strings.js         动态文案（下载状态、表单提示等，中英各一份）
    ├── data/releases.json    版本清单（下载按钮的唯一数据来源）
    ├── assets/               Logo 与吉祥物素材
    ├── _headers             Pages 安全响应头与缓存策略
    ├── robots.txt
    └── sitemap.xml
```

## 本地预览

```bash
cd website/site
python3 -m http.server 4173
# 打开 http://127.0.0.1:4173/
```

> 直接双击 `index.html` 也能看，但 `data/releases.json` 会被浏览器的 file:// 限制拦住，
> 下载区会退回到“尚未开放”状态。要完整验证请用上面的本地服务器。

## 品牌色

全部集中在 `css/site.css` 顶部的 `:root`，改这几个变量即可整体换色：

| 变量 | 值 | 用途 |
| --- | --- | --- |
| `--accent` | `#1f7ae8` | 主色，按钮、链接、强调 |
| `--accent-strong` | `#1666cc` | 主色加深，标题与边框 |
| `--cyan` | `#17c8e8` | 青色辅助色，渐变与光晕 |
| `--sky` / `--tint` | `#eef5ff` | 浅色底，卡片图标底 |
| Hero 背景 | `#05132b → #0e3364` | 深蓝渐变，见 `.hero-section` |

## 接入真实下载

编辑 `data/releases.json`。结构与 IDN Claw 的发布清单一致，站点会自动读取：

```json
{
  "release": {
    "appVersion": "2026.10.1",
    "title": "IDN Code 桌面端",
    "status": "published",
    "releaseNotes": "本次更新……",
    "downloads": [
      { "platform": "mac", "arch": "arm64", "label": "Mac Apple Silicon",
        "available": true, "url": "https://…/IDN-Code.zip",
        "sha256": "…", "size": 489677208 }
    ]
  }
}
```

- `status` 为 `published` 且某条 `available: true` 且有 `url` 时，对应按钮变成真实下载；
- 否则按钮显示“即将开放下载”，点击后自动滚动到订阅框并聚焦邮箱输入；
- 版本号、文件大小、SHA-256 会自动填进下载区的校验卡片。

如果清单放在独立域名（例如 `https://cdn.idncode.com/releases.json`），
修改 `js/site.js` 顶部的 `CONFIG.releasesUrl` 即可，注意也支持跨域读取。

## 接入订阅接口

`js/site.js` 顶部：

```js
var CONFIG = {
  releasesUrl: "./data/releases.json",
  waitlistEndpoint: "",              // 填入接口地址后改为 POST JSON
  supportEmail: "support@idncode.com"
};
```

- `waitlistEndpoint` 为空：使用 `mailto:` 兜底，把邮箱和关注平台发到客服邮箱；
- 填入接口地址：以 `POST {"email":"…","platform":"…","lang":"zh"}` 提交，前端只根据 HTTP 状态提示成功或失败。

## 上线前建议替换

1. **吉祥物蓝色版**：当前复用现有小思思素材（兔子耳朵为粉色，四宫格背景是高饱和青色）。
   如果能出一套蓝底或透明底版本，替换 `assets/` 下同名文件即可，无需改代码。
2. **客服邮箱**：`support@idncode.com` 目前是占位，全站共出现在首页下载区、页脚与两份法务页。
3. **落地域名**：各页 `<link rel="canonical">` 与 `hreflang` 按实际域名核对一遍。
4. **法务文本**：隐私政策与服务条款为初稿，正式上线前请走一遍法务确认；生效日期在两张页面的 `.updated` 里。
5. **文案事实**：首页关于“模型通道 / 自带 API Key / 生成 PPT·PDF·Word·Excel”的描述按实际产品能力再核对一次。

## 浏览器支持

ES5 语法 + `fetch`；Chrome / Edge / Safari / Firefox 近两年版本均可。
禁用 JavaScript 时内容完整可读（`.no-js` 会让滚动显现元素直接显示），仅下载状态与订阅表单不可用。
