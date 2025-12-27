# performance/consumers.py
import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .utils import get_all_metrics  # 确保从您的 utils.py 文件导入获取指标的函数

class PerformanceConsumer(AsyncWebsocketConsumer):
    """
    WebSocket 消费者，用于实时推送服务器性能数据。
    """
    async def connect(self):
        """当客户端发起 WebSocket 连接时调用"""
        # 接受客户端的连接请求
        await self.accept()
        
        # 设置一个标志，控制发送数据的循环
        self.is_connected = True
        
        # 启动一个后台任务，持续发送性能数据
        asyncio.create_task(self.send_performance_data())

    async def disconnect(self, close_code):
        """当 WebSocket 连接断开时调用"""
        # 将连接标志设为 False，以停止发送数据的循环
        self.is_connected = False

    async def receive(self, text_data):
        """当从客户端收到消息时调用（本例中可选）"""
        # 如果需要根据客户端发送的指令（如请求特定数据）来响应，可以在这里处理
        # 例如，可以解析 text_data 中的 JSON 指令
        try:
            data = json.loads(text_data)
            if data.get('action') == 'get_immediate_data':
                # 立即获取并发送一次数据
                await self.send_single_update()
        except json.JSONDecodeError:
            pass

    async def send_performance_data(self):
        """定期发送性能数据的后台任务"""
        while self.is_connected:
            try:
                # 使用 sync_to_async 包装同步函数，以便在异步环境中调用
                metrics = await sync_to_async(get_all_metrics)()
                # 发送数据给客户端
                await self.send(text_data=json.dumps({
                    'type': 'performance_update',
                    'data': metrics
                }))
            except Exception as e:
                # 记录错误，但不要崩溃，继续循环
                print(f"Error sending performance data: {e}")
                # 可以选择在出错时断开连接
                # await self.close(code=1011)  # 1011 是服务器错误码
                # break
            # 等待2秒后再次发送
            await asyncio.sleep(2)

    async def send_single_update(self):
        """立即发送一次性能数据（可用于响应客户端请求）"""
        try:
            metrics = await sync_to_async(get_all_metrics)()
            await self.send(text_data=json.dumps({
                'type': 'immediate_update',
                'data': metrics
            }))
        except Exception as e:
            print(f"Error in single update: {e}")