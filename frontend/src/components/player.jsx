import { h, Observer } from 'destam-dom';
import { Button, Icon, Slider, Typography } from 'destamatic-ui';

// Format time in "MM:SS"
const formatTime = (milliseconds) => {
    const totalSeconds = Math.round(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const Player = ({ Shared }, _, cleanup) => {
    const value = Observer.mutable(0);
    const durationMs = Observer.mutable(60000);
    const status = Observer.mutable(true);

    cleanup(() => {
        const startTime = Date.now();
        const intervalId = setInterval(() => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;

            if (elapsed >= durationMs.get()) {
                value.set(100);
                clearInterval(intervalId);
            } else {
                const newValue = (elapsed / durationMs.get()) * 100;
                value.set(newValue);
            }
        }, 10);
    });

    return <div $style={{ textAlign: 'center' }}>
        <div $style={{ width: '300px', margin: '0 auto' }}>
            <Slider max={Observer.mutable(100)} OValue={value} />
            <div 
                $style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                <Typography type='p2'>
                    {value.map(v => {
                        const elapsedMilliseconds = (v / 100) * durationMs.get();
                        return `${formatTime(elapsedMilliseconds)}`;
                    })}
                </Typography>
                <Typography type='p2'>
                    {value.map(v => {
                        const elapsedMilliseconds = (v / 100) * durationMs.get();
                        const remainingMilliseconds = durationMs.get() - elapsedMilliseconds;
                        return `-${formatTime(remainingMilliseconds)}`;
                    })}
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
                    <Icon style={{fill: 'currentColor'}} libraryName='feather' iconName='rewind' size='30' />
                }
            />
            <Button
                type='icon'
                Icon={
                    status.map(s => s
                        ? <Icon style={{fill: 'currentColor'}} libraryName='feather' iconName='play' size='30' />
                        :  <Icon style={{fill: 'currentColor'}} libraryName='feather' iconName='pause' size='30' />
                    )
                }
                onMouseDown={status.set(!status.get())}
            />
            <Button type='icon' Icon={<Icon style={{fill: 'currentColor'}} libraryName='feather' iconName='fast-forward' size='30' />} />
        </div>
    </div>
};

export default Player;
