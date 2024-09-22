# takes in a music file, outputs music file and lyrics object
# Assumes that the file being passed in has absolutely no lyrics
# Assumes that this program producees the most accurate lyrics
import json
import os

from jobrouter import job
from global_vars import transcription_handler


@job(name="lyrics")
async def lyrics(file_path: str):
    lyrics = transcription_handler(file_path=file_path)

    # TODO: use mongo state streaming system instead.
    head, _ = os.path.split(file_path)
    file_name = os.path.basename(file_path)
    with open(os.path.join(head, f"{file_name}.lyrics.json"), "w") as f:
        json.dump(lyrics, f, indent=4)
