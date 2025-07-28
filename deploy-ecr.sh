#!/bin/bash
set -e

# 変数設定
AWS_REGION="ap-southeast-2"
ECR_REPOSITORY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-web"
IMAGE_TAG="latest"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "=== ECRへのデプロイを開始します ==="
echo "リポジトリ: $ECR_REPOSITORY"
echo "タグ: $IMAGE_TAG, $TIMESTAMP"

# 環境変数を読み込む
if [ -f .env ]; then
    echo "📋 環境変数を読み込み中..."
    export $(cat .env | grep -E '^VITE_' | xargs)
else
    echo "⚠️  警告: .envファイルが見つかりません"
    exit 1
fi

# ECRにログイン
echo "📦 ECRにログイン中..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REPOSITORY

# Dockerイメージをビルド（環境変数を渡す）
echo "🔨 Dockerイメージをビルド中..."
docker build \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  -t watchme-web .

# ECR用のタグを付与
echo "🏷️  イメージにタグを付けています..."
docker tag watchme-web:latest $ECR_REPOSITORY:$IMAGE_TAG
docker tag watchme-web:latest $ECR_REPOSITORY:$TIMESTAMP

# ECRにプッシュ
echo "📤 ECRにプッシュ中..."
docker push $ECR_REPOSITORY:$IMAGE_TAG
docker push $ECR_REPOSITORY:$TIMESTAMP

echo "=== デプロイが完了しました ==="
echo "ECRリポジトリ: $ECR_REPOSITORY"
echo "イメージタグ: $IMAGE_TAG および $TIMESTAMP"
echo ""
echo "本番環境での起動:"
echo "  ssh ubuntu@3.24.16.82"
echo "  ./run-prod.sh"