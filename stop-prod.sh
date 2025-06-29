#!/bin/bash

echo "🛑 WatchMe v8 プロダクションサーバーを停止しています..."

# サーバープロセスを停止
if pgrep -f "node.*server.cjs" > /dev/null; then
    echo "⚠️  サーバープロセスを停止中..."
    pkill -f "node.*server.cjs"
    sleep 2
    
    # 停止確認
    if pgrep -f "node.*server.cjs" > /dev/null; then
        echo "⚠️  強制終了中..."
        pkill -9 -f "node.*server.cjs"
        sleep 1
    fi
    
    echo "✅ プロダクションサーバーを停止しました"
else
    echo "ℹ️  実行中のサーバープロセスが見つかりませんでした"
fi 