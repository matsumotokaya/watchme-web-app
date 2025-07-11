#!/bin/bash

# WatchMe v8 開発サーバー停止スクリプト
echo "🛑 WatchMe v8 開発サーバーを停止しています..."

# プロジェクトディレクトリに移動
cd "$(dirname "$0")"

# 停止されたプロセスのカウント
STOPPED_COUNT=0

# PIDファイルから停止
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "🔧 バックエンドサーバー (PID: $BACKEND_PID) を停止中..."
        kill $BACKEND_PID 2>/dev/null
        ((STOPPED_COUNT++))
    fi
    rm -f .backend.pid
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "⚡ フロントエンドサーバー (PID: $FRONTEND_PID) を停止中..."
        kill $FRONTEND_PID 2>/dev/null
        ((STOPPED_COUNT++))
    fi
    rm -f .frontend.pid
fi

# npmプロセスを確認して停止
echo "📦 npmプロセスを確認中..."
NPM_PIDS=$(ps aux | grep -E "npm run (dev|server)" | grep -v grep | awk '{print $2}')
if [ ! -z "$NPM_PIDS" ]; then
    echo "   npmプロセスを停止中: $NPM_PIDS"
    echo $NPM_PIDS | xargs kill 2>/dev/null
    ((STOPPED_COUNT++))
fi

# その他のNode.jsプロセスも停止
echo "📝 その他の関連プロセスを確認中..."
VITE_COUNT=$(pkill -f "node.*vite" 2>/dev/null; echo $?)
SERVER_COUNT=$(pkill -f "node.*server.cjs" 2>/dev/null; echo $?)

if [ $VITE_COUNT -eq 0 ] || [ $SERVER_COUNT -eq 0 ]; then
    ((STOPPED_COUNT++))
fi

# ログファイルのクリーンアップオプション
if [ "$1" = "--clean-logs" ]; then
    echo "🧽 ログファイルを削除中..."
    rm -f vite.log server.log
    echo "   ログファイルを削除しました"
fi

# 結果の表示
if [ $STOPPED_COUNT -gt 0 ]; then
    echo "✅ サーバーを停止しました"
else
    echo "ℹ️  実行中のサーバープロセスが見つかりませんでした"
fi