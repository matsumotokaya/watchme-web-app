#!/bin/bash

echo "🚀 WatchMe v8 プロダクションサーバーを起動しています..."

# 既存のプロセスを確認
echo "📋 既存のプロセスを確認中..."
if pgrep -f "node.*server.cjs" > /dev/null; then
    echo "⚠️  既存のサーバープロセスを停止中..."
    pkill -f "node.*server.cjs"
    sleep 2
fi

# ネットワークIPアドレスを取得
NETWORK_IP=$(ifconfig | grep -E "inet.*broadcast" | awk '{print $2}' | head -n1)
echo "🌐 ネットワークIPアドレス: $NETWORK_IP"

# プロダクションビルドを実行
echo "🔨 プロダクションビルドを実行中..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ ビルドに失敗しました"
    exit 1
fi

# プロダクションサーバーを起動
echo "🚀 プロダクションサーバーを起動中..."
NODE_ENV=production node --experimental-modules server.cjs &

# 起動確認
sleep 3
if pgrep -f "node.*server.cjs" > /dev/null; then
    echo "✅ プロダクションサーバーが起動しました！"
    echo "📱 アクセスURL:"
    echo "   ローカル:     http://localhost:3001"
    echo "   ネットワーク: http://$NETWORK_IP:3001"
    echo "🔧 API:          http://localhost:3001/api"
    echo "💡 終了するには Ctrl+C を押すか、./stop-prod.sh を実行してください"
    
    # フォアグラウンドで実行
    wait
else
    echo "❌ サーバーの起動に失敗しました"
    exit 1
fi 