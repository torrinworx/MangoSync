import { h, Observer } from 'destam-dom';
import { Button, Icon, Slider, Typography } from 'destamatic-ui';

import fileStream from './fileStream';

// Format time in "MM:SS"
const formatTime = (milliseconds) => {
    const totalSeconds = Math.round(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getSong = (song) => {
    
}

const Player = ({ ...props }) => {
    const value = Observer.mutable(0);
    const durationMs = Observer.mutable(0);
    const playerStatus = Observer.mutable(false);
    const drag = Observer.mutable(false);
    const audio = new Audio();
    const path = Observer.mutable('/home/torrin/Repositories/Personal/MangoSync/music/American Idiot.flac');
    const lyrics = Observer.mutable('/home/torrin/Repositories/Personal/MangoSync/music/American Idiot.enhanced.lrc');
    const volume = Observer.mutable(0.5);

    const handleFile = (song) => {
        fileStream(
            song
        ).then(audioBlob => {
            const audioUrl = URL.createObjectURL(audioBlob);
            audio.src = audioUrl;

            audio.addEventListener('loadedmetadata', () => {
                durationMs.set(audio.duration * 1000); // Convert seconds to milliseconds
                console.log(`Duration: ${audio.duration} seconds`);
            });

            audio.load();
        }).catch(error => {
            console.error("Failed to stream music via WebSocket:", error);
        });

        fileStream(lyrics.get())
            .then(lyricsBlob => {
                const reader = new FileReader();
                reader.onload = () => {
                    const lyricsText = reader.result;
                    console.log("Lyrics from server:", lyricsText);
                    // You can now handle the lyrics text as needed
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
            audio.play();
        } else {
            audio.pause();
        };
    });

    // Listen for the timeupdate event to update the current time
    audio.addEventListener('timeupdate', () => {
        value.set(audio.currentTime * 1000);
    });

    drag.watch(() => {
        audio.currentTime = value.get() / 1000;
    });

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
    };

    handleFile(path.get());

    return <div $style={{ textAlign: 'center' }}>
        {/* <TextArea OValue={path} placeholder={'music file path'} /> */}
        <div $style={{ width: '300px', margin: '0 auto' }}>
            <Slider
                max={durationMs}
                OValue={value}
                onDragStart={() => {
                    drag.set(true);

                    if (playerStatus) {
                        audio.pause();
                    };
                }}
                onDragEnd={() => {
                    drag.set(false);

                    if (playerStatus) {
                        audio.play();
                    };
                }}
                onChange={(e) => {
                    audio.currentTime = value.get() / 1000;
                }}
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
