# takes in a music file, outputs music file and lyrics object
# Assumes that the file being passed in has absolutely no lyrics
# Assumes that this program producees the most accurate lyrics

from fastapi import WebSocket

from tasks import task
from global_vars import transcription_handler


@task(name="lyrics")
async def lyrics(file_path: str, ws: WebSocket):
    transcription_handler(file_path=file_path)
    pass
