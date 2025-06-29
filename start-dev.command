#!/bin/bash

# WatchMe v8 開発サーバー起動スクリプト
echo "🚀 WatchMe v8 開発サーバーを起動しています..."

# プロジェクトディレクトリに移動
cd "$(dirname "$0")"

# 既存のプロセスを確認・終了
echo "📋 既存のプロセスを確認中..."
pkill -f "node.*vite" 2>/dev/null
pkill -f "node.*server.cjs" 2>/dev/null
sleep 2

# IPアドレスを取得・表示
IP_ADDRESS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "🌐 ネットワークIPアドレス: $IP_ADDRESS"

# バックエンドサーバー起動（バックグラウンド）
echo "🔧 バックエンドサーバーを起動中..."
npm run server &
BACKEND_PID=$!

# 少し待ってからフロントエンドサーバー起動
sleep 3
echo "⚡ フロントエンドサーバーを起動中..."
npm run dev &
FRONTEND_PID=$!

# 起動完了メッセージ
sleep 5
echo ""
echo "✅ 開発サーバーが起動しました！"
echo ""
echo "📱 アクセスURL:"
echo "   ローカル:     http://localhost:5173"
echo "   ネットワーク: http://$IP_ADDRESS:5173"
echo ""
echo "🔧 バックエンドAPI: http://localhost:3001"
echo ""
echo "💡 終了するには Ctrl+C を押してください"
echo ""

# プロセスIDを保存
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# 終了シグナルをキャッチして子プロセスも終了
trap 'echo ""; echo "🛑 サーバーを停止中..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f .backend.pid .frontend.pid; exit' INT TERM

# フォアグラウンドで待機
wait