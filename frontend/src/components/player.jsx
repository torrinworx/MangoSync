import { h, Observer, OObject } from 'destam-dom';
import { Button, Icon, Slider, Typography } from 'destamatic-ui';

import streamMusicViaWebSocket from './music_stream';

// Format time in "MM:SS"
const formatTime = (milliseconds) => {
    const totalSeconds = Math.round(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const Player = ({ ...props }) => {
    const audio = Observer.mutable(new Audio());
    const value = Observer.mutable(0);
    const durationMs = Observer.mutable(60000); // Initial dummy duration
    const playerStatus = Observer.mutable(false);
    const drag = Observer.mutable(false);
    
    // Fetch the audio stream using WebSocket
    streamMusicViaWebSocket('/home/torrin/repositories/personal/MangoSync/frontend/public/assets/music/American Idiot.flac').then(audioBlob => {
        const audioUrl = URL.createObjectURL(audioBlob);
        audio.get().src = audioUrl;
        
        audio.get().addEventListener('loadedmetadata', () => {
            durationMs.set(audio.get().duration * 1000); // Convert seconds to milliseconds
            console.log(`Duration: ${audio.get().duration} seconds`);
        });

        audio.get().load();
    }).catch(error => {
        console.error("Failed to stream music via WebSocket:", error);
    });

    playerStatus.watch(delta => {
        if (delta.value) {
            audio.get().play();
        } else {
            audio.get().pause();
        }
    });

    // Listen for the timeupdate event to update the current time
    audio.get().addEventListener('timeupdate', () => {
        if (!drag.get()) {
            value.set(audio.get().currentTime * 1000); // Convert seconds to milliseconds
        }
    });

    // Adjust the audio currentTime when the slider value changes
    value.watch(v => {
        if (drag.get()) {
            audio.get().currentTime = v / 1000; // Convert milliseconds to seconds
        }
    });

    return <div $style={{ textAlign: 'center' }}>
        <div $style={{ width: '300px', margin: '0 auto' }}>
            <Slider
                max={durationMs}
                OValue={value}
                onDragStart={() => { drag.set(true); }}
                onDragEnd={() => { drag.set(false); }}
                onChange={() => { audio.get().currentTime = value.get() / 1000; }}
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
    </div>;
};

export default Player;
