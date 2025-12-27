from django.shortcuts import render
from django.http import JsonResponse
from .utils import get_all_metrics
import json

def dashboard(request):
    """渲染监控面板页面"""
    return render(request, 'performance/dashboard.html')

def get_performance_data(request):
    """API接口：获取性能数据"""
    metrics = get_all_metrics()
    return JsonResponse(metrics)

# WebSocket消费者
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import json

class PerformanceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.running = True
        asyncio.create_task(self.send_performance_data())
    
    async def disconnect(self, close_code):
        self.running = False
    
    async def receive(self, text_data):
        # 处理客户端消息
        pass
    
    async def send_performance_data(self):
        """定时发送性能数据"""
        from .utils import get_all_metrics
        from asgiref.sync import sync_to_async
        
        while self.running:
            # 异步获取数据
            metrics = await sync_to_async(get_all_metrics)()
            
            await self.send(text_data=json.dumps({
                'type': 'performance_update',
                'data': metrics
            }))
            
            await asyncio.sleep(2)  # 每2秒更新一次