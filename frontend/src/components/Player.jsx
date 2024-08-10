import { h, Observer, OArray } from 'destam-dom';
import { Button, Icon, Slider, Typography } from 'destamatic-ui';

import fileStream from './fileStream';
import LyricsDisplay from './LyricsDisplay';

// Format time in "MM:SS"
const formatTime = (milliseconds) => {
    const totalSeconds = Math.round(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const timeToMs = (time) => {
    const [minutes, seconds] = time.split(':');
    const [secs, ms] = seconds.split('.');
    return (parseInt(minutes) * 60 * 1000) + (parseInt(secs) * 1000) + (ms ? parseInt(ms.padEnd(3, '0')) : 0);
};

const convertELRCToJSON = (elrc) => {
    return elrc.trim().split('\n').map(line => {
        const matches = line.match(/\[(\d{2}:\d{2}\.\d{2,3})\]\s\[(\d{2}:\d{2}\.\d{2,3})\]\s(.*)/);
        return matches ? { 
            startTime: timeToMs(matches[1].trim()), 
            endTime: timeToMs(matches[2].trim()), 
            text: matches[3].trim() 
        } : null;
    }).filter(item => item !== null);
};

const Player = ({ ...props }) => {
    const value = Observer.mutable(0);
    const durationMs = Observer.mutable(0);
    const playerStatus = Observer.mutable(false);
    const drag = Observer.mutable(false);
    const audio = new Audio();
    const path = Observer.mutable('./music/The American Dream Is Killing Me.flac');
    const lyrics = Observer.mutable('./music/The American Dream Is Killing Me.enhanced.lrc');
    const lyricsJson = OArray([]);
    const volume = Observer.mutable(0.5);
    let intervalId = null;

    const updateTime = () => {
        if (!drag.get()) {
            value.set(audio.currentTime * 1000);
        }
    };

    const startPlaying = () => {
        intervalId = setInterval(updateTime, 1);
        audio.play();
    };

    const stopPlaying = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        audio.pause();
    };

    const handleFile = (song) => {
        fileStream(song)
            .then(audioBlob => {
                const audioUrl = URL.createObjectURL(audioBlob);
                audio.src = audioUrl;

                audio.addEventListener('loadedmetadata', () => {
                    durationMs.set(audio.duration * 1000);
                });

                audio.load();
            }).catch(error => {
                console.error("Failed to stream music via WebSocket:", error);
            });

        fileStream(lyrics.get())
            .then(lyricsBlob => {
                const reader = new FileReader();
                reader.onload = () => {
                    const lyricsELRC = reader.result;
                    lyricsJson.splice(0, lyricsJson.length, ...convertELRCToJSON(lyricsELRC));
                };
                reader.onerror = () => {
                    console.error("Failed to read lyrics file:", reader.error);
                };
                reader.readAsText(lyricsBlob);
            })
            .catch(error => {
                console.error("Failed to stream lyrics via WebSocket:", error);
            });
    };

    path.watch(d => {
        handleFile(d.value);
    });

    playerStatus.watch(d => {
        if (d.value) {
            startPlaying();
        } else {
            stopPlaying();
        }
    });

    drag.watch(() => {
        audio.currentTime = value.get() / 1000;

        if (!playerStatus.get()) {
            stopPlaying();
        }
    });

    const handleDragStart = () => {
        drag.set(true);
        stopPlaying();
    };

    const handleDragEnd = () => {
        drag.set(false);
        if (playerStatus.get()) {
            startPlaying();
        }
    };

    const handleSliderChange = () => {
        if (!drag.get()) {
            audio.currentTime = value.get() / 1000;
        }
    };

    volume.watch(d => {
        audio.volume = d.value;
    });

    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => {
            playerStatus.set(true);
        });

        navigator.mediaSession.setActionHandler('pause', () => {
            playerStatus.set(false);
        });

        navigator.mediaSession.setActionHandler('stop', () => {
            playerStatus.set(false);
            audio.currentTime = 0;
        });

        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            audio.currentTime = Math.max(audio.currentTime - (details.seekOffset || 10), 0);
            value.set(audio.currentTime * 1000);
        });

        navigator.mediaSession.setActionHandler('seekforward', (details) => {
            audio.currentTime = Math.min(audio.currentTime + (details.seekOffset || 10), audio.duration);
            value.set(audio.currentTime * 1000);
        });
    }

    handleFile(path.get());

    return <div $style={{ textAlign: 'center' }}>
        <LyricsDisplay value={value} lyricsJson={lyricsJson} />
        <div $style={{ width: '300px', margin: '0 auto' }}>
            <Slider
                max={durationMs}
                OValue={value}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onChange={handleSliderChange}
            />
            <div $style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                <Typography type='p2'>
                    {value.map(v => formatTime(v))}
                </Typography>
                <Typography type='p2'>
                    {value.map(v => `-${formatTime(durationMs.get() - v)}`)}
                </Typography>
            </div>
        </div>
        <div $style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '300px',
            margin: '20px auto'
        }}>
            <Button
                type='icon'
                Icon={
                    <Icon style={{ fill: 'currentColor' }} libraryName='feather' iconName='rewind' size='30' />
                }
            />
            <Button
                type='icon'
                Icon={
                    playerStatus.map(s => s
                        ? <Icon style={{ fill: 'currentColor' }} libraryName='feather' iconName='pause' size='30' />
                        : <Icon style={{ fill: 'currentColor' }} libraryName='feather' iconName='play' size='30' />
                    )
                }
                onClick={() => playerStatus.set(!playerStatus.get())}
            />
            <Button type='icon' Icon={<Icon style={{ fill: 'currentColor' }} libraryName='feather' iconName='fast-forward' size='30' />} />
        </div>
        <div $style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '300px',
            margin: '20px auto'
        }}>
            <Icon style={{ fill: 'currentColor' }} libraryName='feather' iconName='volume' size='30' />
            <Slider OValue={volume} min={0} max={1} step={0.01} />
            <Icon style={{ fill: 'currentColor' }} libraryName='feather' iconName='volume-2' size='30' />
        </div>
    </div>;
};

export default Player;
