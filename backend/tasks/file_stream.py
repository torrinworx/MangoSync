import json
import aiofiles

from fastapi import WebSocket
from tasks import task


@task(name="file_stream")
async def file_stream(file_path: str, ws: WebSocket, chunk_size: int = 4096):
    """
    Streams a file through the WebSocket in chunks.

    Args:
        file_path (str): The path to the file.
        ws (WebSocket): The WebSocket connection instance.
        chunk_size (int, optional): The size of each chunk to be read and sent. Default is 4096 bytes.
    """

    try:
        async with aiofiles.open(file_path, "rb") as f:
            chunk = await f.read(chunk_size)
            while chunk:
                # Sending the chunk through WebSocket
                await ws.send_bytes(chunk)
                # Read the next chunk
                chunk = await f.read(chunk_size)
        await ws.send_text(
            json.dumps({"status": "completed", "message": "Stream finished"})
        )
    except FileNotFoundError:
        await ws.send_text(
            json.dumps({"status": "error", "message": f"File '{file_path}' not found."})
        )
    except Exception as ex:
        await ws.send_text(
            json.dumps({"status": "error", "message": f"An error occurred: {str(ex)}"})
        )
