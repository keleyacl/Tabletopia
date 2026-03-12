#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

DOMAIN="game.yuxinlai.com"
WWW_ROOT="/var/www/tabletopia"
CERTBOT_EMAIL=""
RUN_INSTALL=1
RUN_CERTBOT=0
HTTP_ONLY=0
DRY_RUN=0

NGINX_AVAILABLE_DIR=""
NGINX_ENABLED_DIR=""
SYSTEMD_DIR="/etc/systemd/system"

BUILD_USER="${SUDO_USER:-$(id -un)}"
BUILD_GROUP="$(id -gn "${BUILD_USER}")"
SERVICE_USER="${BUILD_USER}"
SERVICE_GROUP="${BUILD_GROUP}"
CURRENT_PATH="${PATH}"
SITE_NAME=""

lookup_binary() {
  local binary_name="$1"

  if command -v "${binary_name}" >/dev/null 2>&1; then
    command -v "${binary_name}"
    return 0
  fi

  local search_dirs=(
    "/usr/local/sbin"
    "/usr/local/bin"
    "/usr/sbin"
    "/usr/bin"
    "/sbin"
    "/bin"
  )

  local dir
  for dir in "${search_dirs[@]}"; do
    if [[ -x "${dir}/${binary_name}" ]]; then
      printf '%s\n' "${dir}/${binary_name}"
      return 0
    fi
  done

  return 1
}

NODE_BIN="$(lookup_binary node || true)"
NPM_BIN="$(lookup_binary npm || true)"
RSYNC_BIN="$(lookup_binary rsync || true)"
NGINX_BIN="$(lookup_binary nginx || true)"
SYSTEMCTL_BIN="$(lookup_binary systemctl || true)"
CERTBOT_BIN="$(lookup_binary certbot || true)"

resolve_home_dir() {
  local user_name="$1"

  if command -v getent >/dev/null 2>&1; then
    local home_dir
    home_dir="$(getent passwd "${user_name}" | cut -d: -f6)"
    if [[ -n "${home_dir}" ]]; then
      printf '%s\n' "${home_dir}"
      return 0
    fi
  fi

  eval "printf '%s\n' \"~${user_name}\""
}

BUILD_HOME="$(resolve_home_dir "${BUILD_USER}")"
NPM_CACHE_DIR="${REPO_ROOT}/.deploy-cache/npm"

TEMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "${TEMP_DIR}"
}

trap cleanup EXIT

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

die() {
  printf '\n[ERROR] %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
用法:
  ./deploy/deploy.sh [options]

默认行为:
  1. 安装依赖
  2. 构建 portal 和 4 个游戏
  3. 同步静态文件到 nginx 目录
  4. 生成并安装 systemd 服务
  5. 生成并安装 nginx 配置
  6. 如未存在证书，则用 certbot 申请 https 证书

选项:
  --domain DOMAIN             域名，默认 game.yuxinlai.com
  --www-root DIR              静态文件目录，默认 /var/www/tabletopia
  --systemd-dir DIR           systemd 目录，默认 /etc/systemd/system
  --nginx-available-dir DIR   nginx sites-available 目录
  --nginx-enabled-dir DIR     nginx sites-enabled 目录
  --certbot-email EMAIL       certbot 邮箱，默认留空
  --enable-https              自动申请证书并生成 https 配置
  --no-install                跳过 npm install
  --no-certbot                不自动申请证书
  --http-only                 只部署 http，不配置 https
  --dry-run                   只打印将要执行的命令
  --help                      显示帮助

示例:
  ./deploy/deploy.sh --domain game.yuxinlai.com
  ./deploy/deploy.sh --domain game.yuxinlai.com --enable-https --certbot-email admin@example.com
  ./deploy/deploy.sh --domain game.yuxinlai.com --no-certbot --http-only
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      DOMAIN="${2:-}"
      shift 2
      ;;
    --www-root)
      WWW_ROOT="${2:-}"
      shift 2
      ;;
    --systemd-dir)
      SYSTEMD_DIR="${2:-}"
      shift 2
      ;;
    --nginx-available-dir)
      NGINX_AVAILABLE_DIR="${2:-}"
      shift 2
      ;;
    --nginx-enabled-dir)
      NGINX_ENABLED_DIR="${2:-}"
      shift 2
      ;;
    --certbot-email)
      CERTBOT_EMAIL="${2:-}"
      shift 2
      ;;
    --enable-https)
      RUN_CERTBOT=1
      shift
      ;;
    --no-install)
      RUN_INSTALL=0
      shift
      ;;
    --no-certbot)
      RUN_CERTBOT=0
      shift
      ;;
    --http-only)
      HTTP_ONLY=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      die "未知参数: $1"
      ;;
  esac
done

SITE_NAME="${DOMAIN}.conf"

[[ -n "${DOMAIN}" ]] || die "--domain 不能为空"
[[ -n "${NPM_BIN}" ]] || die "未找到 npm"
[[ -n "${NODE_BIN}" ]] || die "未找到 node"

if [[ "${HTTP_ONLY}" -eq 1 ]]; then
  RUN_CERTBOT=0
fi

if [[ "${EUID}" -eq 0 ]]; then
  SUDO_CMD=()
else
  command -v sudo >/dev/null 2>&1 || die "需要 sudo，但当前环境找不到 sudo"
  SUDO_CMD=(sudo)
fi

run_cmd() {
  if [[ "${DRY_RUN}" -eq 1 ]]; then
    printf '+'
    for arg in "$@"; do
      printf ' %q' "${arg}"
    done
    printf '\n'
    return 0
  fi
  "$@"
}

run_root_cmd() {
  run_cmd "${SUDO_CMD[@]}" "$@"
}

run_build_cmd() {
  if [[ "${DRY_RUN}" -eq 1 ]]; then
    printf '+'
    if [[ "${EUID}" -eq 0 && "${BUILD_USER}" != "root" ]]; then
      printf ' sudo -u %q HOME=%q PATH=%q npm_config_cache=%q' \
        "${BUILD_USER}" "${BUILD_HOME}" "${CURRENT_PATH}" "${NPM_CACHE_DIR}"
    fi
    for arg in "$@"; do
      printf ' %q' "${arg}"
    done
    printf '\n'
    return 0
  fi

  if [[ "${EUID}" -eq 0 && "${BUILD_USER}" != "root" ]]; then
    sudo -u "${BUILD_USER}" \
      HOME="${BUILD_HOME}" \
      PATH="${CURRENT_PATH}" \
      npm_config_cache="${NPM_CACHE_DIR}" \
      "$@"
    return 0
  fi

  HOME="${BUILD_HOME}" \
    PATH="${CURRENT_PATH}" \
    npm_config_cache="${NPM_CACHE_DIR}" \
    "$@"
}

run_in_dir() {
  local dir="$1"
  shift

  if [[ "${DRY_RUN}" -eq 1 ]]; then
    printf '+ cd %q &&' "${dir}"
    for arg in "$@"; do
      printf ' %q' "${arg}"
    done
    printf '\n'
    return 0
  fi

  (
    cd "${dir}"
    "$@"
  )
}

run_build_in_dir() {
  local dir="$1"
  shift

  if [[ "${DRY_RUN}" -eq 1 ]]; then
    printf '+ cd %q &&' "${dir}"
    if [[ "${EUID}" -eq 0 && "${BUILD_USER}" != "root" ]]; then
      printf ' sudo -u %q HOME=%q PATH=%q npm_config_cache=%q' \
        "${BUILD_USER}" "${BUILD_HOME}" "${CURRENT_PATH}" "${NPM_CACHE_DIR}"
    fi
    for arg in "$@"; do
      printf ' %q' "${arg}"
    done
    printf '\n'
    return 0
  fi

  (
    cd "${dir}"
    run_build_cmd "$@"
  )
}

detect_nginx_layout() {
  if [[ -n "${NGINX_AVAILABLE_DIR}" && -n "${NGINX_ENABLED_DIR}" ]]; then
    return 0
  fi

  if [[ -d /etc/nginx/sites-available || -d /etc/nginx/sites-enabled ]]; then
    NGINX_AVAILABLE_DIR="${NGINX_AVAILABLE_DIR:-/etc/nginx/sites-available}"
    NGINX_ENABLED_DIR="${NGINX_ENABLED_DIR:-/etc/nginx/sites-enabled}"
    return 0
  fi

  if [[ -d /etc/nginx/conf.d ]]; then
    NGINX_AVAILABLE_DIR="${NGINX_AVAILABLE_DIR:-/etc/nginx/conf.d}"
    NGINX_ENABLED_DIR="${NGINX_ENABLED_DIR:-/etc/nginx/conf.d}"
    return 0
  fi

  die "无法自动识别 nginx 配置目录，请传入 --nginx-available-dir 和 --nginx-enabled-dir"
}

ensure_binary() {
  local binary_path="$1"
  local binary_name="$2"
  [[ -n "${binary_path}" ]] || die "缺少命令: ${binary_name}"
}

ensure_base_dependencies() {
  ensure_binary "${RSYNC_BIN}" "rsync"
  ensure_binary "${NGINX_BIN}" "nginx"
  ensure_binary "${SYSTEMCTL_BIN}" "systemctl"
}

has_certificate() {
  [[ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]] &&
    [[ -f "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" ]]
}

render_systemd_service() {
  local unit_name="$1"
  local workdir="$2"
  local port="$3"
  local output="$4"

  cat > "${output}" <<EOF
[Unit]
Description=Tabletopia ${unit_name} Server
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_GROUP}
WorkingDirectory=${workdir}
Environment=NODE_ENV=production
Environment=PORT=${port}
Environment=ALLOWED_ORIGIN=https://${DOMAIN},http://${DOMAIN}
Environment=PATH=${CURRENT_PATH}
ExecStart=${NPM_BIN} run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
}

render_http_site_config() {
  local output="$1"

  cat > "${output}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    root ${WWW_ROOT};

    location ^~ /.well-known/acme-challenge/ {
        try_files \$uri =404;
    }

    location /azul/assets/ {
        try_files \$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /splendor-duel/assets/ {
        try_files \$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /lost-cities/assets/ {
        try_files \$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /jaipur/assets/ {
        try_files \$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /azul/socket.io {
        proxy_pass http://127.0.0.1:3001/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_read_timeout 600s;
    }

    location /splendor-duel/socket.io {
        proxy_pass http://127.0.0.1:3003/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_read_timeout 600s;
    }

    location /lost-cities/ws {
        proxy_pass http://127.0.0.1:3005/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_read_timeout 600s;
    }

    location /jaipur/socket.io {
        proxy_pass http://127.0.0.1:3007/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_read_timeout 600s;
    }

    location /azul/ {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ /azul/index.html;
    }

    location /splendor-duel/ {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ /splendor-duel/index.html;
    }

    location /lost-cities/ {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ /lost-cities/index.html;
    }

    location /jaipur/ {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ /jaipur/index.html;
    }

    location / {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
}

render_https_site_config() {
  local output="$1"

  cat > "${output}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    root ${WWW_ROOT};

    location ^~ /.well-known/acme-challenge/ {
        try_files \$uri =404;
    }

    location /azul/assets/ {
        try_files \$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /splendor-duel/assets/ {
        try_files \$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /lost-cities/assets/ {
        try_files \$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /jaipur/assets/ {
        try_files \$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /azul/socket.io {
        proxy_pass http://127.0.0.1:3001/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_read_timeout 600s;
    }

    location /splendor-duel/socket.io {
        proxy_pass http://127.0.0.1:3003/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_read_timeout 600s;
    }

    location /lost-cities/ws {
        proxy_pass http://127.0.0.1:3005/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_read_timeout 600s;
    }

    location /jaipur/socket.io {
        proxy_pass http://127.0.0.1:3007/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_read_timeout 600s;
    }

    location /azul/ {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ /azul/index.html;
    }

    location /splendor-duel/ {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ /splendor-duel/index.html;
    }

    location /lost-cities/ {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ /lost-cities/index.html;
    }

    location /jaipur/ {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ /jaipur/index.html;
    }

    location / {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ /index.html;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    root ${WWW_ROOT};

    location /azul/assets/ {
        try_files \$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /splendor-duel/assets/ {
        try_files \$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /lost-cities/assets/ {
        try_files \$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /jaipur/assets/ {
        try_files \$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /azul/socket.io {
        proxy_pass http://127.0.0.1:3001/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_read_timeout 600s;
    }

    location /splendor-duel/socket.io {
        proxy_pass http://127.0.0.1:3003/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_read_timeout 600s;
    }

    location /lost-cities/ws {
        proxy_pass http://127.0.0.1:3005/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_read_timeout 600s;
    }

    location /jaipur/socket.io {
        proxy_pass http://127.0.0.1:3007/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_read_timeout 600s;
    }

    location /azul/ {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ /azul/index.html;
    }

    location /splendor-duel/ {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ /splendor-duel/index.html;
    }

    location /lost-cities/ {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ /lost-cities/index.html;
    }

    location /jaipur/ {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ /jaipur/index.html;
    }

    location / {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
}

install_nginx_site() {
  local rendered_config="$1"
  local target_path="${NGINX_AVAILABLE_DIR}/${SITE_NAME}"

  run_root_cmd mkdir -p "${NGINX_AVAILABLE_DIR}"
  run_root_cmd install -m 0644 "${rendered_config}" "${target_path}"

  if [[ "${NGINX_ENABLED_DIR}" != "${NGINX_AVAILABLE_DIR}" ]]; then
    run_root_cmd mkdir -p "${NGINX_ENABLED_DIR}"
    run_root_cmd ln -sf "${target_path}" "${NGINX_ENABLED_DIR}/${SITE_NAME}"
  fi

  run_root_cmd "${NGINX_BIN}" -t
  run_root_cmd "${SYSTEMCTL_BIN}" reload nginx
}

install_systemd_services() {
  log "安装 systemd 服务"

  render_systemd_service \
    "Azul" \
    "${REPO_ROOT}/azul/packages/server" \
    "3001" \
    "${TEMP_DIR}/azul.service"

  render_systemd_service \
    "Splendor Duel" \
    "${REPO_ROOT}/splendor-duel/packages/server" \
    "3003" \
    "${TEMP_DIR}/splendor-duel.service"

  render_systemd_service \
    "Lost Cities" \
    "${REPO_ROOT}/lost_cities/packages/server" \
    "3005" \
    "${TEMP_DIR}/lost-cities.service"

  render_systemd_service \
    "Jaipur" \
    "${REPO_ROOT}/jaipur/packages/server" \
    "3007" \
    "${TEMP_DIR}/jaipur.service"

  run_root_cmd mkdir -p "${SYSTEMD_DIR}"
  run_root_cmd install -m 0644 "${TEMP_DIR}/azul.service" "${SYSTEMD_DIR}/azul.service"
  run_root_cmd install -m 0644 "${TEMP_DIR}/splendor-duel.service" "${SYSTEMD_DIR}/splendor-duel.service"
  run_root_cmd install -m 0644 "${TEMP_DIR}/lost-cities.service" "${SYSTEMD_DIR}/lost-cities.service"
  run_root_cmd install -m 0644 "${TEMP_DIR}/jaipur.service" "${SYSTEMD_DIR}/jaipur.service"

  run_root_cmd "${SYSTEMCTL_BIN}" daemon-reload
  run_root_cmd "${SYSTEMCTL_BIN}" enable --now azul.service
  run_root_cmd "${SYSTEMCTL_BIN}" enable --now splendor-duel.service
  run_root_cmd "${SYSTEMCTL_BIN}" enable --now lost-cities.service
  run_root_cmd "${SYSTEMCTL_BIN}" enable --now jaipur.service
}

maybe_install_dependencies() {
  local project_dir="$1"
  if [[ "${RUN_INSTALL}" -eq 1 ]]; then
    run_build_in_dir "${project_dir}" "${NPM_BIN}" install
  fi
}

build_projects() {
  local projects=(
    "portal"
    "azul"
    "splendor-duel"
    "lost_cities"
    "jaipur"
  )

  for project in "${projects[@]}"; do
    log "安装依赖并构建 ${project}"
    maybe_install_dependencies "${REPO_ROOT}/${project}"
    run_build_in_dir "${REPO_ROOT}/${project}" "${NPM_BIN}" run build
  done
}

sync_static_files() {
  log "同步静态文件到 ${WWW_ROOT}"

  run_root_cmd mkdir -p \
    "${WWW_ROOT}" \
    "${WWW_ROOT}/azul" \
    "${WWW_ROOT}/splendor-duel" \
    "${WWW_ROOT}/lost-cities" \
    "${WWW_ROOT}/jaipur"

  run_root_cmd "${RSYNC_BIN}" -a --delete "${REPO_ROOT}/portal/dist/" "${WWW_ROOT}/"
  run_root_cmd "${RSYNC_BIN}" -a --delete "${REPO_ROOT}/azul/packages/client/dist/" "${WWW_ROOT}/azul/"
  run_root_cmd "${RSYNC_BIN}" -a --delete "${REPO_ROOT}/splendor-duel/packages/client/dist/" "${WWW_ROOT}/splendor-duel/"
  run_root_cmd "${RSYNC_BIN}" -a --delete "${REPO_ROOT}/lost_cities/packages/client/dist/" "${WWW_ROOT}/lost-cities/"
  run_root_cmd "${RSYNC_BIN}" -a --delete "${REPO_ROOT}/jaipur/packages/client/dist/" "${WWW_ROOT}/jaipur/"
}

configure_nginx() {
  log "安装 nginx 配置"

  if has_certificate; then
    render_https_site_config "${TEMP_DIR}/site.conf"
    install_nginx_site "${TEMP_DIR}/site.conf"
    return 0
  fi

  render_http_site_config "${TEMP_DIR}/site.conf"
  install_nginx_site "${TEMP_DIR}/site.conf"

  if [[ "${RUN_CERTBOT}" -eq 0 ]]; then
    log "当前不强制 https，已按 http 配置完成"
    return 0
  fi

  ensure_binary "${CERTBOT_BIN}" "certbot"

  log "申请 https 证书"
  if [[ -n "${CERTBOT_EMAIL}" ]]; then
    run_root_cmd "${CERTBOT_BIN}" certonly --webroot -w "${WWW_ROOT}" -d "${DOMAIN}" --email "${CERTBOT_EMAIL}" --agree-tos --non-interactive
  else
    run_root_cmd "${CERTBOT_BIN}" certonly --webroot -w "${WWW_ROOT}" -d "${DOMAIN}" --register-unsafely-without-email --agree-tos --non-interactive
  fi

  render_https_site_config "${TEMP_DIR}/site.conf"
  install_nginx_site "${TEMP_DIR}/site.conf"
}

verify_deployment() {
  if [[ "${DRY_RUN}" -eq 1 ]]; then
    return 0
  fi

  if command -v curl >/dev/null 2>&1; then
    log "验证后端健康状态"
    curl --fail --silent http://127.0.0.1:3001/health >/dev/null
    curl --fail --silent http://127.0.0.1:3003/health >/dev/null
    curl --fail --silent http://127.0.0.1:3007/health >/dev/null
  fi

  log "验证 systemd 服务状态"
  "${SYSTEMCTL_BIN}" is-active --quiet azul.service
  "${SYSTEMCTL_BIN}" is-active --quiet splendor-duel.service
  "${SYSTEMCTL_BIN}" is-active --quiet lost-cities.service
  "${SYSTEMCTL_BIN}" is-active --quiet jaipur.service
}

print_summary() {
  local scheme="https"
  if ! has_certificate || [[ "${RUN_CERTBOT}" -eq 0 && "${HTTP_ONLY}" -eq 1 ]]; then
    scheme="http"
  fi

  printf '\n部署完成:\n'
  printf '  域名: %s\n' "${DOMAIN}"
  printf '  仓库: %s\n' "${REPO_ROOT}"
  printf '  静态目录: %s\n' "${WWW_ROOT}"
  printf '  首页: %s://%s/\n' "${scheme}" "${DOMAIN}"
  printf '  Azul: %s://%s/azul/\n' "${scheme}" "${DOMAIN}"
  printf '  Splendor Duel: %s://%s/splendor-duel/\n' "${scheme}" "${DOMAIN}"
  printf '  Lost Cities: %s://%s/lost-cities/\n' "${scheme}" "${DOMAIN}"
  printf '  Jaipur: %s://%s/jaipur/\n' "${scheme}" "${DOMAIN}"
}

main() {
  detect_nginx_layout
  ensure_base_dependencies
  run_build_cmd mkdir -p "${NPM_CACHE_DIR}"

  log "部署配置"
  printf '  DOMAIN=%s\n' "${DOMAIN}"
  printf '  REPO_ROOT=%s\n' "${REPO_ROOT}"
  printf '  WWW_ROOT=%s\n' "${WWW_ROOT}"
  printf '  BUILD_USER=%s\n' "${BUILD_USER}"
  printf '  BUILD_HOME=%s\n' "${BUILD_HOME}"
  printf '  NPM_CACHE_DIR=%s\n' "${NPM_CACHE_DIR}"
  printf '  SERVICE_USER=%s\n' "${SERVICE_USER}"
  printf '  SERVICE_GROUP=%s\n' "${SERVICE_GROUP}"
  printf '  NPM_BIN=%s\n' "${NPM_BIN}"
  printf '  RSYNC_BIN=%s\n' "${RSYNC_BIN}"
  printf '  NGINX_BIN=%s\n' "${NGINX_BIN}"
  printf '  SYSTEMCTL_BIN=%s\n' "${SYSTEMCTL_BIN}"
  printf '  NGINX_AVAILABLE_DIR=%s\n' "${NGINX_AVAILABLE_DIR}"
  printf '  NGINX_ENABLED_DIR=%s\n' "${NGINX_ENABLED_DIR}"

  build_projects
  sync_static_files
  install_systemd_services
  configure_nginx
  verify_deployment
  print_summary
}

main
