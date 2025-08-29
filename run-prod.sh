#!/bin/bash
set -e

ECR_REPOSITORY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-web"
AWS_REGION="ap-southeast-2"

echo "=== watchme-web 本番環境起動 ==="
echo "リポジトリ: $ECR_REPOSITORY"

# 実行場所のチェック
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ エラー: docker-compose.prod.yml が見つかりません"
    echo "カレントディレクトリ: $(pwd)"
    echo "このスクリプトは docker-compose.prod.yml と同じディレクトリで実行してください"
    exit 1
fi

# .env ファイルのチェック
if [ ! -f ".env" ]; then
    echo "⚠️  警告: .env ファイルが見つかりません"
    echo "環境変数が設定されていることを確認してください"
    echo "必要に応じて .env.example をコピーして設定してください:"
    echo "  cp .env.example .env"
    echo "  nano .env"
fi

# watchme-networkの確認（インフラストラクチャ管理体制）
echo "🌐 watchme-networkの確認中..."
if ! docker network ls | grep -q "watchme-network"; then
    echo "⚠️  watchme-networkが存在しません"
    echo "インフラストラクチャを起動してください:"
    echo "  cd /home/ubuntu/watchme-server-configs"
    echo "  docker-compose -f docker-compose.infra.yml up -d"
    exit 1
else
    echo "✅ watchme-networkが確認されました"
fi

# ECRから最新イメージをプル
echo "📦 ECRから最新イメージをプル中..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REPOSITORY

docker pull $ECR_REPOSITORY:latest

# 既存のコンテナを停止・削除
echo "🛑 既存のコンテナを停止中..."
docker-compose -f docker-compose.prod.yml down || true

# コンテナを起動
echo "🚀 本番環境でコンテナを起動中..."
docker-compose -f docker-compose.prod.yml up -d

# 起動確認
echo "⏳ 起動確認中..."
sleep 5

# ヘルスチェック
echo "🏥 ヘルスチェック実行中..."
for i in {1..10}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ ヘルスチェック成功！"
        break
    fi
    echo -n "."
    sleep 3
done

# コンテナの状態を表示
echo ""
echo "📊 コンテナ状態:"
docker ps | grep -E "CONTAINER|watchme-web" || echo "コンテナが見つかりません"

echo ""
echo "=== 起動完了 ==="
echo "アプリケーションURL: http://localhost:3001"
echo "公開URL: https://dashboard.hey-watch.me"
echo ""
echo "ログ確認:"
echo "  docker logs -f watchme-web-prod"
echo ""
echo "コンテナ状態確認:"
echo "  docker ps | grep watchme-web"