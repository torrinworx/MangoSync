import { h, Observer } from 'destam-dom';
import { Button, Icon, Slider, Typography } from 'destamatic-ui';

// Format time in "MM:SS:MMM" format where MMM stands for milliseconds
const formatTime = (milliseconds) => {
    const totalSeconds = Math.round(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const Player = ({ Shared }) => {
    const value = Observer.mutable(0);
    const durationMs = Observer.mutable(5000);

    const startTime = Date.now();

    const updateValue = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;

        if (elapsed < durationMs.get()) {
            const newValue = (elapsed / durationMs.get()) * 100;
            value.set(newValue);
            requestAnimationFrame(updateValue);
        }
    };

    // Start the continuous update
    requestAnimationFrame(updateValue);

    return <div $style={{ textAlign: 'center' }}>
        <div $style={{ width: '300px', margin: '0 auto' }}>
            <Slider max={Observer.mutable(100)} OValue={value} />
            <div 
                $style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                {/* Far Left: Elapsed Time */}
                <Typography type='p2'>
                    {value.map(v => {
                        const elapsedMilliseconds = (v / 100) * durationMs.get();
                        return `${formatTime(elapsedMilliseconds)}`;
                    })}
                </Typography>
                {/* Far Right: Remaining Time */}
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
            <Button type='icon' Icon={<Icon libraryName='feather' iconName='rewind' size='30' />} />
            <Button type='icon' Icon={<Icon libraryName='feather' iconName='play' size='30' />} />
            <Button type='icon' Icon={<Icon libraryName='feather' iconName='fast-forward' size='30' />} />
        </div>
    </div>;
};

export default Player;
