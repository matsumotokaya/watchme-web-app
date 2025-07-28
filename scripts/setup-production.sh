#!/bin/bash

# 本番環境セットアップスクリプト
# EC2インスタンスで実行してください

set -e

echo "🚀 WatchMe Web 本番環境セットアップを開始します"

# 1. 既存のサービスを停止
echo "🛑 既存のサービスを停止中..."
sudo systemctl stop watchme-web-app || true
sudo systemctl disable watchme-web-app || true

# 2. 古いアプリケーションディレクトリをバックアップ
if [ -d "/home/ubuntu/watchme-web-app" ]; then
    echo "📦 既存のアプリケーションをバックアップ中..."
    sudo mv /home/ubuntu/watchme-web-app /home/ubuntu/watchme-web-app.backup.$(date +%Y%m%d%H%M%S)
fi

# 3. 新しいディレクトリ構造を作成
echo "📁 ディレクトリ構造を作成中..."
mkdir -p /home/ubuntu/watchme-docker
cd /home/ubuntu/watchme-docker

# 4. 必要なファイルをダウンロード
echo "📥 設定ファイルをダウンロード中..."
# docker-compose.ymlと.env.production.exampleをダウンロード
# (実際の本番環境では、セキュアな方法でファイルを転送してください)

# 5. systemdサービスファイルを作成
echo "⚙️  systemdサービスファイルを作成中..."
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
TimeoutStartSec=300
Restart=on-failure
RestartSec=30
User=ubuntu

[Install]
WantedBy=multi-user.target
EOF

# 6. systemdをリロード
echo "🔄 systemdをリロード中..."
sudo systemctl daemon-reload

# 7. Nginxの設定を更新（必要に応じて）
echo "🌐 Nginx設定を確認中..."
# upstream設定をlocalhost:3001に向ける

echo "✅ セットアップが完了しました！"
echo ""
echo "次のステップ:"
echo "1. /home/ubuntu/watchme-docker/.env.production を作成して環境変数を設定"
echo "2. docker-compose.yml を配置"
echo "3. sudo systemctl start watchme-docker でサービスを開始"
echo "4. sudo systemctl enable watchme-docker で自動起動を有効化"