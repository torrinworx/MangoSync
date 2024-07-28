import json
import aiofiles

from fastapi import WebSocket
from tasks import task

@task(name="stream_music")
async def stream_music(filepath: str, ws: WebSocket):
    """
    Streams a music file through the WebSocket in chunks.

    Args:
        filepath (str): The path to the music file.
        ws (WebSocket): The WebSocket connection instance.
        payload (dict): The initial payload received from the client.
    """
    chunk_size = 4096  # Define the size of each chunk to be sent

    try:
        async with aiofiles.open(filepath, 'rb') as f:
            chunk = await f.read(chunk_size)
            while chunk:
                # Sending the chunk through WebSocket
                await ws.send_bytes(chunk)
                # Read the next chunk
                chunk = await f.read(chunk_size)
        await ws.send_text(json.dumps({"status": "completed", "message": "Stream finished"}))
    except FileNotFoundError:
        await ws.send_text(json.dumps({"status": "error", "message": f"File '{filepath}' not found."}))
    except Exception as ex:
        await ws.send_text(json.dumps({"status": "error", "message": f"An error occurred: {str(ex)}"}))
