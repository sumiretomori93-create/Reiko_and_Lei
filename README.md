# Reiko & Lei · 独立版本

现有水玻璃网站 + 独立登录、多人编辑、数据库和图片/音频上传。无需 GPT 登录，不使用 Sites 或另一平台的内置数据库。使用 Node.js 24 自带 SQLite，无需 npm 安装依赖。

## 本机启动

安装 Node.js 24，在此文件夹打开终端：

```sh
npm run account -- reiko@example.com Reiko editor
npm run account -- lei@example.com Lei editor
npm start
```

将示例邮箱换成真实邮箱标识，按提示分别设置至少 12 位密码。邮箱只是登录名，此版本不发送验证邮件或密码重置邮件。打开 http://localhost:8080 ，登录后点右下角“整理记忆”。账号由站点持有人邀请创建，不开放注册；可创建 viewer 账号供受邀的人浏览。忘记密码时重新运行同一邮箱的 account 命令。

后台支持记录新增、修改、删除，上传图片和歌曲音源。先“更新这条”，再“保存全部修改”。多人同时保存会检测版本冲突，拒绝覆盖：先导出你的未保存内容，再重新载入最新数据，合并修改后保存。页面刷新时读取最新内容，不提供即时协同光标。

## 独立上线

适合拥有持久磁盘、支持 Node.js 24 或 Docker 的服务器/托管服务。这个 SQLite 版本不适合直接放进无持久磁盘的 Vercel 静态部署或 Cloudflare Pages；若选择这些平台，需要改接外部数据库及对象存储。

1. 把源码放进你们拥有的 Git 仓库或服务器，选择独立主机和自己的域名。
2. 使用 Docker Compose 启动：`docker compose up -d --build`。
3. 创建两个独立账号：`docker compose exec archive node account.mjs 邮箱 显示名 editor`。
4. 在 `.env` 中设置 `APP_ORIGIN=https://你的域名`；使用 Caddy/Nginx 或托管服务的 HTTPS 入口转发到 8080。Compose 默认仅绑定主机回环地址，需配置反向代理才能公网访问。
5. 按用户最新要求，Compose 和配置示例使用 `PUBLIC_READ=true`，所有内容及已上传文件公开，只有编辑账号可写入。改为受邀浏览时设置 `PUBLIC_READ=false` 并重启。直接本机启动且未配置此变量时仍采用私密默认。此版本是全站访问开关，不是逐条公开设置。
6. 配置磁盘/卷备份，并实际验证恢复。

密码使用 scrypt 哈希，登录 cookie 为 HttpOnly / SameSite，HTTPS 网站使用 Secure；写入需 CSRF token。上传最大 20 MB，支持 JPG/PNG/WebP/MP3/WAV/OGG/FLAC/M4A；上传文件存磁盘，不允许上传 HTML/SVG。没有演示默认密码或写在前端的管理员密钥。

## 数据与备份

本机 `data/archive.sqlite` 与 `data/uploads/`；Docker 对应 `archive-data` 卷。生产环境需持久保存两者。完整备份应停服务后复制整个数据目录（包含 SQLite WAL/SHM 文件），或使用 SQLite 的一致性备份方式。后台 JSON 导出只含内容及素材地址，不含账号或素材文件。删除条目不会立即删除上传文件，避免其他条目引用失效。

初次启动导入现有网站内容，其中示例仍标为示例。已有数据库时不会被初始内容覆盖。数据和密码不应提交到 Git。可用 `npm test` 验证独立登录、权限、上传、版本冲突。

目前交付的是可运行的独立源码；尚未连接你们的托管账号、购买域名或部署到公网。现有 GPT/Sites 网址仍保留原来的浏览版本。
