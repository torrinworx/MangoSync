from pydantic import BaseModel
from typing import List, Dict, Union


class Lyrics(BaseModel):
    # Time synced individual words as they are said with start/end times to be highlighted as they are sung
    time_synced: List[Dict[str, Union[int, str]]]

    # Segments of a song to be displayed in the lyricsDisplay component, with start and end times
    segments: List[Dict[str, Union[int, str]]]
