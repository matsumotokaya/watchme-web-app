# マルチステージビルドを使用して最適化
# Stage 1: Build stage
FROM node:20-alpine AS builder

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --legacy-peer-deps

# ソースコードをコピー
COPY . .

# ビルド時の環境変数を設定（ビルドに必要な最小限の値）
# 実際の値は実行時に.env.productionから読み込まれる
ARG VITE_SUPABASE_URL=https://placeholder.supabase.co
ARG VITE_SUPABASE_ANON_KEY=placeholder_key

# 本番用ビルドを実行
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# 本番環境に必要なパッケージのみインストール
COPY package*.json ./
RUN npm ci --legacy-peer-deps --production && npm cache clean --force

# ビルド済みのファイルをコピー
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY --from=builder /app/config ./config
COPY --from=builder /app/public ./public

# デフォルトのディレクトリ構造を作成
RUN mkdir -p data_accounts

# ポートを公開
EXPOSE 3001

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# アプリケーションを起動
CMD ["npm", "run", "start"]