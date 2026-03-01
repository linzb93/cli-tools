#!/bin/bash

echo "🔍 检测7001端口状态..."

# 方法1: 使用lsof
if command -v lsof &> /dev/null; then
    echo "使用lsof检测:"
    lsof -i :7001 2>/dev/null || echo "❌ lsof: 7001端口无进程"
fi

# 方法2: 使用netstat
if command -v netstat &> /dev/null; then
    echo "使用netstat检测:"
    netstat -an | grep :7001 || echo "❌ netstat: 7001端口无监听"
fi

# 方法3: 使用ss
if command -v ss &> /dev/null; then
    echo "使用ss检测:"
    ss -tuln | grep :7001 || echo "❌ ss: 7001端口无监听"
fi

# 方法4: 使用nc测试连接
if command -v nc &> /dev/null; then
    echo "使用nc测试连接:"
    timeout 2 nc -z localhost 7001 && echo "✅ nc: 7001端口可连接" || echo "❌ nc: 7001端口无法连接"
fi

echo ""
echo "📋 总结:"
echo "如果以上命令都显示7001端口无监听，说明WebSocket服务未启动"