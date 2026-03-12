# Tabletopia Nginx 部署说明

这套部署方式适用于把站点挂到同一个域名 `game.yuxinlai.com` 下：

- 首页：`https://game.yuxinlai.com/`
- Azul：`https://game.yuxinlai.com/azul/`
- Splendor Duel：`https://game.yuxinlai.com/splendor-duel/`
- Lost Cities：`https://game.yuxinlai.com/lost-cities/`
- Jaipur：`https://game.yuxinlai.com/jaipur/`

## 一键部署

如果你已经在服务器上把仓库拉下来了，最简单的方式是直接执行：

```bash
cd /你的仓库路径/Tabletopia
chmod +x deploy/deploy.sh
./deploy/deploy.sh --domain game.yuxinlai.com
```

如果你希望脚本自动申请 HTTPS 证书，推荐带上邮箱：

```bash
./deploy/deploy.sh --domain game.yuxinlai.com --certbot-email you@example.com
```

如果你暂时只想先跑通 HTTP：

```bash
./deploy/deploy.sh --domain game.yuxinlai.com --no-certbot --http-only
```

脚本会自动完成：

- 安装依赖
- 构建所有前端和后端
- 同步静态文件到 `nginx`
- 生成并安装 `systemd` 服务
- 生成并安装 `nginx` 配置
- 可选申请 HTTPS 证书

脚本默认使用当前仓库目录作为服务工作目录，不要求项目必须放在 `/opt/tabletopia`。

## 1. 准备目录

下面用 `/opt/tabletopia` 作为代码目录，用 `/var/www/tabletopia` 作为静态文件目录。  
如果你的服务器路径不同，把下面命令里的路径替换掉即可。

```bash
sudo mkdir -p /opt
sudo mkdir -p /var/www/tabletopia
sudo mkdir -p /var/www/tabletopia/azul
sudo mkdir -p /var/www/tabletopia/splendor-duel
sudo mkdir -p /var/www/tabletopia/lost-cities
sudo mkdir -p /var/www/tabletopia/jaipur
```

把仓库放到：

```bash
/opt/tabletopia
```

## 2. 安装项目依赖

每个项目都是独立的 npm workspace，需要分别安装依赖。

```bash
cd /opt/tabletopia/portal && npm install
cd /opt/tabletopia/azul && npm install
cd /opt/tabletopia/splendor-duel && npm install
cd /opt/tabletopia/lost_cities && npm install
cd /opt/tabletopia/jaipur && npm install
```

## 3. 生成生产构建

```bash
cd /opt/tabletopia/portal && npm run build
cd /opt/tabletopia/azul && npm run build
cd /opt/tabletopia/splendor-duel && npm run build
cd /opt/tabletopia/lost_cities && npm run build
cd /opt/tabletopia/jaipur && npm run build
```

构建完成后，会得到这些前端产物：

- `portal/dist`
- `azul/packages/client/dist`
- `splendor-duel/packages/client/dist`
- `lost_cities/packages/client/dist`
- `jaipur/packages/client/dist`

后端产物会在各自的：

- `packages/server/dist`

## 4. 拷贝静态文件到 Nginx 目录

```bash
sudo rsync -a --delete /opt/tabletopia/portal/dist/ /var/www/tabletopia/
sudo rsync -a --delete /opt/tabletopia/azul/packages/client/dist/ /var/www/tabletopia/azul/
sudo rsync -a --delete /opt/tabletopia/splendor-duel/packages/client/dist/ /var/www/tabletopia/splendor-duel/
sudo rsync -a --delete /opt/tabletopia/lost_cities/packages/client/dist/ /var/www/tabletopia/lost-cities/
sudo rsync -a --delete /opt/tabletopia/jaipur/packages/client/dist/ /var/www/tabletopia/jaipur/
```

## 5. 配置后端常驻服务

推荐用 `systemd`，只需要常驻 4 个游戏后端：

- Azul: `3001`
- Splendor Duel: `3003`
- Lost Cities: `3005`
- Jaipur: `3007`

仓库里已经放了模板：

- `deploy/systemd/azul.service`
- `deploy/systemd/splendor-duel.service`
- `deploy/systemd/lost-cities.service`
- `deploy/systemd/jaipur.service`

先复制到系统目录：

```bash
sudo cp /opt/tabletopia/deploy/systemd/azul.service /etc/systemd/system/
sudo cp /opt/tabletopia/deploy/systemd/splendor-duel.service /etc/systemd/system/
sudo cp /opt/tabletopia/deploy/systemd/lost-cities.service /etc/systemd/system/
sudo cp /opt/tabletopia/deploy/systemd/jaipur.service /etc/systemd/system/
```

如果你的代码目录不是 `/opt/tabletopia`，先编辑这 4 个 service 文件里的 `WorkingDirectory` 和 `ExecStart`。

然后启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now azul.service
sudo systemctl enable --now splendor-duel.service
sudo systemctl enable --now lost-cities.service
sudo systemctl enable --now jaipur.service
```

检查状态：

```bash
sudo systemctl status azul.service
sudo systemctl status splendor-duel.service
sudo systemctl status lost-cities.service
sudo systemctl status jaipur.service
```

查看日志：

```bash
journalctl -u azul.service -f
journalctl -u splendor-duel.service -f
journalctl -u lost-cities.service -f
journalctl -u jaipur.service -f
```

## 6. 配置 Nginx

仓库里已经放了模板：

- `deploy/nginx/game.yuxinlai.com.conf`

复制并启用：

```bash
sudo cp /opt/tabletopia/deploy/nginx/game.yuxinlai.com.conf /etc/nginx/sites-available/game.yuxinlai.com.conf
sudo ln -sf /etc/nginx/sites-available/game.yuxinlai.com.conf /etc/nginx/sites-enabled/game.yuxinlai.com.conf
sudo nginx -t
sudo systemctl reload nginx
```

如果你的系统不是 `sites-available/sites-enabled` 结构，就把模板内容合并到你自己的 `nginx.conf` 里。

## 7. 申请 HTTPS 证书

如果你用 `certbot`：

```bash
sudo certbot --nginx -d game.yuxinlai.com
```

成功后再检查：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 8. 检查域名解析

确保 `game.yuxinlai.com` 的 DNS A 记录已经指向你的服务器公网 IP。

本机检查：

```bash
dig +short game.yuxinlai.com
```

## 9. 验证

先验证后端：

```bash
curl http://127.0.0.1:3001/health
curl http://127.0.0.1:3003/health
curl http://127.0.0.1:3007/health
```

`lost-cities` 是原生 WebSocket 服务，没有 `/health` 接口，检查端口即可：

```bash
ss -ltnp | grep 3005
```

再验证 Nginx：

```bash
curl -I http://game.yuxinlai.com
curl -I https://game.yuxinlai.com
curl -I https://game.yuxinlai.com/azul/
curl -I https://game.yuxinlai.com/splendor-duel/
curl -I https://game.yuxinlai.com/lost-cities/
curl -I https://game.yuxinlai.com/jaipur/
```

如果某个子应用更新后出现“页面能开，但样式错乱/JS 不对”的情况，通常是浏览器拿着旧的 HTML 去请求已经删除的旧资源文件。现在的 nginx 模板已经把 `/assets/` 路径改成严格 `404`，不会再回退到 `index.html` 冒充 CSS/JS。

## 10. 以后更新版本

每次更新代码后执行：

```bash
cd /opt/tabletopia/portal && npm run build
cd /opt/tabletopia/azul && npm run build
cd /opt/tabletopia/splendor-duel && npm run build
cd /opt/tabletopia/lost_cities && npm run build
cd /opt/tabletopia/jaipur && npm run build
```

然后同步静态文件：

```bash
sudo rsync -a --delete /opt/tabletopia/portal/dist/ /var/www/tabletopia/
sudo rsync -a --delete /opt/tabletopia/azul/packages/client/dist/ /var/www/tabletopia/azul/
sudo rsync -a --delete /opt/tabletopia/splendor-duel/packages/client/dist/ /var/www/tabletopia/splendor-duel/
sudo rsync -a --delete /opt/tabletopia/lost_cities/packages/client/dist/ /var/www/tabletopia/lost-cities/
sudo rsync -a --delete /opt/tabletopia/jaipur/packages/client/dist/ /var/www/tabletopia/jaipur/
```

最后重启后端：

```bash
sudo systemctl restart azul.service
sudo systemctl restart splendor-duel.service
sudo systemctl restart lost-cities.service
sudo systemctl restart jaipur.service
```
