import { h, Observer } from "destam-dom";
import { Typography } from "destamatic-ui";

const LyricsDisplay = ({ value, lyricsJson }) => {
    const currentLyric = Observer.mutable(['']);

    value.watch(delta => {
        const currentTime = delta.value;

        // Find the current lyric based on the currentTime
        const foundLyric = lyricsJson.find(
          lyric => currentTime >= lyric.startTime && currentTime < lyric.endTime
        );

        // Update the currentLyric with the found lyric's text or set it to an empty string if not found
        if (foundLyric) {
            currentLyric.set([foundLyric.text]);
        } else {
            // currentLyric.set(['']);
        }
    });

    return (
        <div>
            <Typography type="h6">
                {currentLyric.map(l => l ? l : null)}
            </Typography>
        </div>
    );
};

export default LyricsDisplay;
