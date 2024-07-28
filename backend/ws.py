import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from global_vars import tasks

logger = logging.getLogger("uvicorn")
router = APIRouter()

@router.websocket(path="/websocket")
async def websocket(ws: WebSocket) -> None:
    """
    WebSocket endpoint that manages incoming messages and task execution.

    Args:
        ws (WebSocket): The WebSocket connection instance.
    """
    await ws.accept()
    try:
        msg = await ws.receive_text()
        await tasks.task_handler(msg=msg, ws=ws)
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected.")
    except Exception as ex:
        logger.error(f"Exception occurred: {ex}")
        try:
            await ws.send_text(f"Error: {str(ex)}")
        except WebSocketDisconnect:
            logger.warning("WebSocket closed while sending error message.")
    finally:
        await ws.close()
        logger.info("WebSocket connection closed.")
