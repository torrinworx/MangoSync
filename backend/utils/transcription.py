import os
import re
import json
import random

import torch
import stable_whisper
from mutagen.mp3 import MP3
from mutagen.flac import FLAC
from mutagen.id3 import ID3, USLT, SYLT, Encoding

from utils import Utils
from utils.models import Lyrics

random.seed(0) # Setting seed so model is deterministic for each run with repeatable results.

class TranscriptionHandler:
    def __init__(self, model_name='base', download_root='./models'):
        # Check if CUDA is available, otherwise use CPU
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"Initializing with device: {device}")

        # Indicate the start of model loading
        print(f"Loading model '{model_name}' from {download_root}. This may take a few moments...")

        # Load the model with the selected device
        self.model = stable_whisper.load_model(
            name=model_name,
            download_root=download_root,
            device=device,
            dq=device == 'cpu'
        )

        # Confirm model loading and mounting on the device
        print(f"Model '{model_name}' successfully loaded and mounted on {device}.")

        # NOTE: When implementing multi track/multi album transcripting, only load the model once.
    
    def __call__(self, file_path):
        print("Starting conversion and transcription process...")
        track_name, artist_name, _ = Utils.get_track_info(file_path)

        print(f"Fetching lyrics for {track_name} by {artist_name}...")
        lyrics = Utils.search_lyrics_online(track_name, artist_name)
        processed_lyrics = lyrics["processed_lyrics"]

        # Extract base file name without extension
        base_file_name = file_path.rsplit('.', 1)[0]  # Extract base file name

        if processed_lyrics:
            result = self._align_and_transcribe(file_path, processed_lyrics, base_file_name)
        else:
            result = self._transcribe(file_path, base_file_name)

        result_dict = result.to_dict()

        segments = []
        time_synced = []
        for s in result_dict['segments']:
            segments.append({
                'start': float(s['start']) * 1000,
                'end': float(s['end']) * 1000,
                'text': s['text']
            })
            time_synced.extend({
                'start': float(i['start']) * 1000,
                'end': float(i['end']) * 1000,
                'word': i['word'],
            } for i in s['words'])

        return Lyrics(
            time_synced=time_synced,
            segments=segments
        )

    def _align_and_transcribe(self, file_path, lyrics, base_file_name):
        print("Lyrics found. Starting alignment with audio...")
        result = self.model.align(
            audio=file_path,
            text=lyrics,
            language='en',
            vad=True,
            demucs=True,
            demucs_options=dict(shifts=2),
            original_split=True,
            regroup=True,
            suppress_silence=True,
            suppress_word_ts=False,
        )

        print("Alignment completed. Saving result...")

        result.save_as_json(os.path.join(os.path.dirname(file_path), 'audio.json'))

        return result
    
    def _transcribe(self, file_path, base_file_name):
        print("Lyrics not found. Starting transcription without alignment...")
        result = self.model.transcribe(
            audio=file_path,
            word_timestamps=True,
        )
        print("Transcription completed. Saving result...")

        # Manually specify the path if save_as_json doesn't return it
        result.save_as_json(os.path.join(os.path.dirname(file_path), 'audio.json'))

        return result

    def _extract_words(self, result):
        words = []
        for segment in result.segments:
            words.extend(segment.words)
        return words

    def _create_lrc(self, words):
        lrc_content = ""
        for word_info in words:
            start_time = self._format_time(word_info.start)
            word = word_info.word.strip()
            lrc_content += f"{start_time} {word}\n"
        return lrc_content

    def _create_enhanced_lrc(self, words):
        enhanced_lrc_content = ""
        for word_info in words:
            start_time = self._format_time(word_info.start)
            end_time = self._format_time(word_info.end)
            word = word_info.word.strip()
            enhanced_lrc_content += f"{start_time} {end_time} {word}\n"
        return enhanced_lrc_content

    def _format_time(self, time_in_seconds):
        minutes = int(time_in_seconds // 60)
        seconds = int(time_in_seconds % 60)
        milliseconds = int((time_in_seconds - int(time_in_seconds)) * 100)
        return f"[{minutes:02d}:{seconds:02d}.{milliseconds:02d}]"

    def _embed_lyrics(self, file_path, enhanced_lrc_path, cleaned_lyrics):
        if file_path.lower().endswith('.mp3'):
            print(f"Embedding lyrics into {file_path} (MP3)...")
            audio = MP3(file_path, ID3=ID3)
            if audio.tags is None:
                audio.add_tags()

            with open(enhanced_lrc_path, 'r', encoding='utf-8') as lrc_file:
                enhanced_lrc = lrc_file.read()

            audio.tags.delall('USLT')
            audio.tags.add(USLT(encoding=Encoding.UTF8, lang='eng', desc='enhanced', text=cleaned_lyrics))

            sylt_lyrics = self._convert_lrc_to_sylt_format(enhanced_lrc)
            audio.tags.delall('SYLT')
            audio.tags.add(SYLT(encoding=Encoding.UTF8, lang='eng', format=2, type=1, desc='enhanced', text=sylt_lyrics))

            audio.save()
            print(f"Lyrics embedded into {file_path} successfully.")
        
        elif file_path.lower().endswith('.flac'):
            print(f"Embedding unsynchronized lyrics into {file_path} (FLAC)...")
            audio = FLAC(file_path)

            # Embedding unsynchronized lyrics as a Vorbis comment
            audio['LYRICS'] = cleaned_lyrics
            audio.save()
            print(f"Unsynchronized lyrics embedded into {file_path} successfully.")

    def _convert_lrc_to_sylt_format(self, lrc_content):
        sylt_data = []
        for line in lrc_content.splitlines():
            parts = line.split(']', 1)
            if len(parts) < 2:
                continue

            timestamp, lyrics = parts
            timestamp = timestamp.strip('[')
            lyrics = lyrics.strip()

            # Remove any bracketed timing information from the lyrics
            lyrics = re.sub(r'\[[^\]]*\]', '', lyrics)

            # Convert timestamp to milliseconds
            minutes, seconds = map(float, timestamp.split(':'))
            total_milliseconds = int((minutes * 60 + seconds) * 1000)

            # Add each word with its timestamp
            words = lyrics.split()
            for word in words:
                # Each word followed by its timestamp
                sylt_data.append((word, total_milliseconds))

        return sylt_data
