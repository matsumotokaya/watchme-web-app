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

# 実行方法を選択
if [ "$1" = "--background" ]; then
    # バックグラウンドモード（Claude Code等の環境用）
    echo "⚙️  バックグラウンドモードで起動中..."
    
    # バックエンドサーバー起動
    echo "🔧 バックエンドサーバーを起動中..."
    nohup npm run server > server.log 2>&1 &
    BACKEND_PID=$!
    echo "   PID: $BACKEND_PID"
    
    # フロントエンドサーバー起動
    sleep 3
    echo "⚡ フロントエンドサーバーを起動中..."
    nohup npm run dev > vite.log 2>&1 &
    FRONTEND_PID=$!
    echo "   PID: $FRONTEND_PID"
    
    # PIDを保存
    echo $BACKEND_PID > .backend.pid
    echo $FRONTEND_PID > .frontend.pid
    
    # 起動確認
    sleep 5
    if ps -p $BACKEND_PID > /dev/null && ps -p $FRONTEND_PID > /dev/null; then
        echo ""
        echo "✅ 開発サーバーが起動しました！"
        echo ""
        echo "📱 アクセスURL:"
        echo "   ローカル:     http://localhost:5173"
        echo "   ネットワーク: http://$IP_ADDRESS:5173"
        echo ""
        echo "🔧 バックエンドAPI: http://localhost:3001"
        echo ""
        echo "📝 ログファイル:"
        echo "   - server.log (バックエンド)"
        echo "   - vite.log (フロントエンド)"
        echo ""
        echo "🛑 停止するには: ./stop-dev.command"
    else
        echo "❌ サーバーの起動に失敗しました"
        exit 1
    fi
else
    # 通常モード（ターミナルでの直接実行用）
    echo "⚙️  通常モードで起動中..."
    
    # concurrentlyを使用可能か確認
    if command -v concurrently &> /dev/null; then
        echo "📦 concurrentlyを使用して起動します"
        echo ""
        echo "📱 アクセスURL:"
        echo "   ローカル:     http://localhost:5173"
        echo "   ネットワーク: http://$IP_ADDRESS:5173"
        echo ""
        echo "🔧 バックエンドAPI: http://localhost:3001"
        echo ""
        echo "💡 終了するには Ctrl+C を押してください"
        echo ""
        
        # concurrentlyで起動
        npm run dev:start
    else
        # concurrentlyがない場合は従来の方法
        echo "⚠️  concurrentlyがインストールされていません"
        echo "📦 従来の方法で起動します"
        
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
    fi
fi