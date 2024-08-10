import { h, Observer } from "destam-dom";
import { Typography } from "destamatic-ui";

const LyricsDisplay = ({ value, lyricsJson }) => {
    const currentLyric = Observer.mutable('');

    const findLyricIndex = (lyrics, currentTime) => {
        let low = 0, high = lyrics.length - 1;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            if (lyrics[mid].startTime <= currentTime && lyrics[mid].endTime > currentTime) {
                return mid;
            } else if (lyrics[mid].startTime > currentTime) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }
        return -1;
    };

    value.watch(delta => {
        const currentTime = delta.value;
        const lyricIndex = findLyricIndex(lyricsJson, currentTime);

        if (lyricIndex !== -1 && currentLyric.get() !== lyricsJson[lyricIndex].text) {
            currentLyric.set(lyricsJson[lyricIndex].text);
        }
    });

    return <div $style={{ minHeight: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography type="h4" fontStyle="bold">
            {currentLyric.map(l => l ? l : ' ')}
        </Typography>
    </div>;
};

export default LyricsDisplay;
