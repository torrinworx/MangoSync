import json
import inspect
import logging

from jobrouter import JobRequest
from fastapi import APIRouter, WebSocket
from fastapi.websockets import WebSocketState, WebSocketDisconnect

from global_vars import jobs


logger = logging.getLogger("uvicorn")
router = APIRouter()

    

@router.websocket(path="/websocket")
async def websocket(ws: WebSocket) -> None:
    """
    WebSocket endpoint that manages incoming messages and job execution.

    Args:
        ws (WebSocket): The WebSocket connection instance.
    """
    """
    Handles job execution requests received over a WebSocket connection.

    Args:
        websocket: The WebSocket connection instance.
    """
    await ws.accept()

    try:
        while True:
            msg = await ws.receive_text()
            payload = json.loads(msg)
            print(payload)
            job_name = payload.get("name")
            args = payload.get("args", {})
            
            job_request = JobRequest(
                name=job_name, 
                args={
                    **args,
                    'ws': ws
                }, 
            )

            print(jobs.jobs)

            job = next(
                (job for job in jobs.jobs if job.get("name") == job_name), None
            )
            
            if not job:
                await ws.send_text(
                    json.dumps({"status": "error", "message": f"Job '{job_name}' not found."})
                )
                continue
            
            try:
                result = await jobs.router(job_request)

                if inspect.isasyncgen(result):
                    async for result in result:
                        await ws.send_text(json.dumps(result))
                else:
                    await ws.send_text(json.dumps(result))
                
            except Exception as ex:
                logger.error(f"Exception occurred: {ex}")
                await ws.send_text(
                    json.dumps(
                        {
                            "status": "error",
                            "message": f"Job '{job_name}' encountered an error: {str(ex)}"
                        }
                    )
                )
    
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected.")
    finally:
        if ws.client_state == WebSocketState.CONNECTED:
            await ws.close()
        logger.info("WebSocket connection closed.")
