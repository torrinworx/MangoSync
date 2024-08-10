import { h, Observer } from "destam-dom";
import { Typography } from "destamatic-ui";

const LyricsDisplay = ({ value, lyricsModel }) => {
    const currentWord = Observer.mutable(null);
    const currentSentence = Observer.mutable(null);
    const currentSentenceElement = Observer.mutable(null);

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

        if (segmentIdx !== -1 && currentSentence.get() !== currentSegment) {
            currentSentence.set(currentSegment);
        }

        if (segmentIdx !== -1 && wordIdx !== -1 && currentWord.get() !== currentSegment.words[wordIdx]) {
            currentWord.set(currentSegment.words[wordIdx]);
        }
    });

    const highlightCurrentWord = () => {
        const currentSegment = currentSentence.get();
        const currentWordValue = currentWord.get();
        if (!currentSegment || !currentWordValue) {
            currentSentenceElement.set(<div> </div>);
            return;
        }

        const words = currentSegment.words.map(word => {
            const isHighlighted = word.word === currentWordValue.word && word.start === currentWordValue.start && word.end === currentWordValue.end;
            return (
                <span $style={{ color: isHighlighted ? 'red' : 'inherit', fontWeight: isHighlighted ? 'bold' : 'normal' }}>
                    {word.word} 
                </span>
            );
        });

        currentSentenceElement.set(<div>{words}</div>);
    };

    currentWord.watch(highlightCurrentWord);
    currentSentence.watch(highlightCurrentWord);

    return (
        <div $style={{ minHeight: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Typography type="h4" fontStyle="bold">
                {currentSentenceElement.map(e => e ? e : ' ')}
            </Typography>
        </div>
    );
};

export default LyricsDisplay;
