import re
from io import BytesIO

import syncedlyrics
from PIL import Image
from mutagen.mp3 import MP3
from mutagen.flac import FLAC
from mutagen.id3 import ID3


class Utils:
    @staticmethod
    def search_lyrics_online(track_name, artist_name):
        try:
            online_lyrics = syncedlyrics.search(f"{track_name} {artist_name}")
            if online_lyrics:
                return Utils._process_online_lyrics(online_lyrics)
            else:
                return {"error": "Lyrics not found."}
        except Exception as e:
            return {"error": f"An error occurred: {e}"}

    @staticmethod
    def _process_online_lyrics(online_lyrics):
        lines = online_lyrics.split("\n")
        processed_lyrics = [
            re.sub(r"\[[^\]]*\]", "", line).strip() for line in lines if line.strip()
        ]
        return {
            "original_lyrics": online_lyrics,
            "processed_lyrics": "\n".join(processed_lyrics),
        }

    @staticmethod
    def get_track_info(file_path):
        if file_path.lower().endswith(".mp3"):
            return Utils.process_mp3_file(file_path)
        elif file_path.lower().endswith(".flac"):
            return Utils.process_flac_file(file_path)
        else:
            return "Unknown", "Unknown", None

    @staticmethod
    def process_mp3_file(file_path):
        audio = MP3(file_path, ID3=ID3)
        song_name = audio["TIT2"].text[0] if "TIT2" in audio else "Unknown"
        artist_name = audio["TPE1"].text[0] if "TPE1" in audio else "Unknown"
        album_art_image = Utils.get_album_art_mp3(audio)
        return song_name, artist_name, album_art_image

    @staticmethod
    def process_flac_file(file_path):
        audio = FLAC(file_path)
        song_name = audio["title"][0] if audio.get("title") else "Unknown"
        artist_name = audio["artist"][0] if audio.get("artist") else "Unknown"
        album_art_image = Utils.get_album_art_flac(audio)
        return song_name, artist_name, album_art_image

    @staticmethod
    def get_album_art_mp3(audio):
        if "APIC:" in audio:
            return Image.open(BytesIO(audio["APIC:"].data))
        return None

    @staticmethod
    def get_album_art_flac(audio):
        if audio.pictures:
            return Image.open(BytesIO(audio.pictures[0].data))
        return None
