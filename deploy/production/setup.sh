#!/bin/bash
# 本番環境セットアップスクリプト

set -e

echo "🚀 WatchMe Web Docker デプロイメントを開始します"

# 色付き出力用の関数
print_info() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

# 1. 既存のサービスを停止
print_info "既存のサービスを確認中..."
if systemctl is-active --quiet watchme-web-app; then
    print_info "既存のサービスを停止中..."
    sudo systemctl stop watchme-web-app
    sudo systemctl disable watchme-web-app || true
    print_success "既存のサービスを停止しました"
else
    print_info "既存のサービスは動作していません"
fi

# 2. 既存のアプリケーションをバックアップ
if [ -d "/home/ubuntu/watchme-web-app" ]; then
    BACKUP_DIR="/home/ubuntu/backups/watchme-web-app-$(date +%Y%m%d%H%M%S)"
    print_info "既存のアプリケーションをバックアップ中: $BACKUP_DIR"
    sudo mkdir -p /home/ubuntu/backups
    sudo mv /home/ubuntu/watchme-web-app "$BACKUP_DIR"
    print_success "バックアップ完了"
fi

# 3. Dockerディレクトリの準備
print_info "Dockerディレクトリを準備中..."
mkdir -p /home/ubuntu/watchme-docker
cd /home/ubuntu/watchme-docker

# 4. docker-compose.ymlの確認
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml が見つかりません"
    print_info "docker-compose.yml を /home/ubuntu/watchme-docker/ に配置してください"
    exit 1
fi

# 5. .env.productionの確認
if [ ! -f ".env.production" ]; then
    print_error ".env.production が見つかりません"
    print_info ".env.production.example をコピーして設定してください:"
    print_info "cp .env.production.example .env.production"
    print_info "nano .env.production"
    exit 1
fi

# 6. ECRログイン
print_info "ECRにログイン中..."
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com
print_success "ECRログイン成功"

# 7. 最新のイメージをプル
print_info "最新のDockerイメージをプル中..."
docker-compose pull
print_success "イメージのプル完了"

# 8. systemdサービスファイルの作成
print_info "systemdサービスファイルを作成中..."
sudo tee /etc/systemd/system/watchme-docker.service > /dev/null <<EOF
[Unit]
Description=WatchMe Web Docker Container
After=docker.service
Requires=docker.service

[Service]
Type=simple
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/watchme-docker
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
ExecReload=/usr/bin/docker-compose pull && /usr/bin/docker-compose up -d
TimeoutStartSec=300
Restart=on-failure
RestartSec=30
User=ubuntu
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 9. systemdをリロード
print_info "systemdをリロード中..."
sudo systemctl daemon-reload
print_success "systemdリロード完了"

# 10. サービスを有効化
print_info "サービスを有効化中..."
sudo systemctl enable watchme-docker
print_success "サービス有効化完了"

# 11. Dockerコンテナを起動
print_info "Dockerコンテナを起動中..."
sudo systemctl start watchme-docker

# 起動確認
sleep 5
if sudo systemctl is-active --quiet watchme-docker; then
    print_success "Dockerコンテナが正常に起動しました"
else
    print_error "Dockerコンテナの起動に失敗しました"
    sudo systemctl status watchme-docker
    exit 1
fi

# 12. ヘルスチェック
print_info "ヘルスチェック中..."
for i in {1..10}; do
    if curl -s http://localhost:3001/health > /dev/null; then
        print_success "ヘルスチェック成功"
        break
    fi
    echo -n "."
    sleep 3
done

# 13. 最終確認
print_info "=== デプロイ状況 ==="
echo "サービス状態:"
sudo systemctl status watchme-docker --no-pager | head -n 10
echo ""
echo "コンテナ状態:"
docker ps | grep watchme
echo ""
echo "ログの確認:"
echo "  sudo journalctl -u watchme-docker -f"
echo "  docker logs watchme-web-app"
echo ""
print_success "デプロイが完了しました！"
print_info "ブラウザで https://dashboard.hey-watch.me にアクセスして確認してください"