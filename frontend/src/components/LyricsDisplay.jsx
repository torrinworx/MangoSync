import { h, Observer } from "destam-dom";
import { Typography } from "destamatic-ui";

const LyricsDisplay = ({ value, lyricsModel }) => {
    const currentWord = Observer.mutable(false);
    const currentSentence = Observer.mutable(false);

    // Function to find the index of the word within a segment and its corresponding index in the lyrics
    const findWordIndexInSegment = (words, currentTime) => {
        for (let i = 0; i < words.length; i++) {
            if (words[i].start <= currentTime && currentTime < words[i].end) {
                return i;
            }
        }
        return -1;
    };

    // Function to locate the segment and word within segment
    const findLyricSegmentAndWord = (lyrics, currentTime) => {
        for (let i = 0; i < lyrics.length; i++) {
            if (lyrics[i].start <= currentTime && currentTime < lyrics[i].end) {
                const wordIdx = findWordIndexInSegment(lyrics[i].words, currentTime);
                if (wordIdx === -1) return { segmentIdx: i, wordIdx: -1 };
                return { segmentIdx: i, wordIdx };
            }
        }
        return { segmentIdx: -1, wordIdx: -1 };
    };

    value.watch(delta => {
        const lyrics = lyricsModel.get();
        const currentTime = delta.value;

        const { segmentIdx, wordIdx } = findLyricSegmentAndWord(lyrics, currentTime);
        const currentSegment = lyrics[segmentIdx];

        if (segmentIdx !== -1 && currentSentence.get() !== currentSegment.text) {
            currentSentence.set(currentSegment);
        }

        if (segmentIdx !== -1 && wordIdx !== -1 && currentWord.get() !== currentSegment.words[wordIdx].word) {
            currentWord.set(currentSegment.words[wordIdx]);
        }
    });

    currentWord.watch(delta => console.log(delta.value));
    currentSentence.watch(delta => console.log(delta.value));

    return <div $style={{ minHeight: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Typography type="h5" fontStyle="italic">
            {currentWord.map(w => w ? w.word : ' ')}
        </Typography>
        <Typography type="h4" fontStyle="bold">
            {currentSentence.map(s => s ? s.text : ' ')}
        </Typography>
    </div>;
};

export default LyricsDisplay;
