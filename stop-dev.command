#!/bin/bash

# WatchMe v8 開発サーバー停止スクリプト
echo "🛑 WatchMe v8 開発サーバーを停止しています..."

# プロジェクトディレクトリに移動
cd "$(dirname "$0")"

# PIDファイルから停止
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill $BACKEND_PID 2>/dev/null
    rm -f .backend.pid
    echo "🔧 バックエンドサーバーを停止しました"
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill $FRONTEND_PID 2>/dev/null
    rm -f .frontend.pid
    echo "⚡ フロントエンドサーバーを停止しました"
fi

# 念のため、プロセス名で検索して停止
pkill -f "node.*vite" 2>/dev/null
pkill -f "node.*server.cjs" 2>/dev/null

echo "✅ すべてのサーバーを停止しました"