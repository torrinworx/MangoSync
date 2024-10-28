# MangoSync
A fun little music player that does a couple of neat things, the goal with MangoSync is to complete your digital albums with additional metadata such as lyrics, animated album art, descriptions, tags, etc, and display them in an eligant ui.

Neat things: 

- Searches for matching song lyrics of your music file online
- Transcribes song lyrics from scratch
- Aligns song lyrics from the above two processes (time stamps start and end times of spoken/sung words)
- Displays lyrics of songs while playing them (karaoke mode)

Almost all of the songs I "aquired" had no lyrics embeded in them, mp3's and flac supposedely support embeded lyrics, but they are finicky and the support of open source tools and music players to display them was lacking. So I decided to build my own. This system uses the Whisper transcription model to transcribe the song audio. Currently I've only tested it's performace with English songs, and it's fairly acceptable. It messes up some lyrics occasionally, sometimes missing entire sentences. The transcription is far less accurate, it produces better results if it firsts retreives lyrics from online rather than to transcribe them from scratch.

Future improvements:
- Diarization: differentiate between n singers in a song in the lyrics and display them in a way to differentiate between them
- GPU usage: Currently the whisper model runs on the CPU by default, running it on a GPU would decrease the speed to transcribe/align the lyrics
- Process separation: The web interface lags pretty badly when the system is transcribing/aligning, performance improvements could be made here
- Multi media completion: Setting up the server to "complete" albums with animated gif artwork (ripped from apple music), to metadata like descriptions and wiki links, to lyrics, creating a complete .album file or something like that to capture the modern day data associated with digital album releases.

Lyrics are an important part of songs because they help people understand what's being said, assist those with difficulty processing spoken language, aid individuals learning a new language, and enhance the musical experience for the deaf.
