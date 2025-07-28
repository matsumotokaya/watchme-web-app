#!/bin/bash

# ECRリポジトリ情報
ECR_REPOSITORY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-web"
AWS_REGION="ap-southeast-2"
AWS_ACCOUNT_ID="754724220380"

# タグ情報
VERSION_TAG=${1:-latest}
TIMESTAMP=$(date +%Y%m%d%H%M%S)

echo "🚀 WatchMe Web Docker イメージをECRにプッシュします"
echo "   リポジトリ: $ECR_REPOSITORY"
echo "   タグ: $VERSION_TAG, $TIMESTAMP"

# AWS ECRにログイン
echo "📦 ECRにログイン中..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY

# イメージをビルド
echo "🔨 Dockerイメージをビルド中..."
docker build -t watchme-web:$VERSION_TAG .

# タグ付け
echo "🏷️  イメージにタグを付けています..."
docker tag watchme-web:$VERSION_TAG $ECR_REPOSITORY:$VERSION_TAG
docker tag watchme-web:$VERSION_TAG $ECR_REPOSITORY:$TIMESTAMP

# ECRにプッシュ
echo "📤 ECRにプッシュ中..."
docker push $ECR_REPOSITORY:$VERSION_TAG
docker push $ECR_REPOSITORY:$TIMESTAMP

echo "✅ 完了しました！"
echo "   イメージ: $ECR_REPOSITORY:$VERSION_TAG"
echo "   イメージ: $ECR_REPOSITORY:$TIMESTAMP"