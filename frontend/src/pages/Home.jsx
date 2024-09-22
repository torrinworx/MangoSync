import { h, Typography, Button } from "destamatic-ui";

import { Observer } from "destam-dom";
import Player from "../components/Player";


const Home = ({ Shared }) => {
    const disabled = Observer.mutable(false);

    return <div
        $style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            position: 'absolute',
            inset: '0px',
        }}
    >
        <Typography variant='h1' >Hello World!</Typography>
        <Button type='text' label="Button" disabled={disabled} onClick={() => disabled.set(true)} />
        <Button type='contained' label="Button" disabled={disabled} onClick={() => disabled.set(true)} />
        <Button type='outlined' label="Button" disabled={disabled} onClick={() => disabled.set(true)} />

        <Button
            type='outlined'
            label="Lyrics"
            onClick={() => {
                const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${location.base || '/'}websocket`;
                const ws = new WebSocket(url);

                ws.onopen = () => {
                    const requestPayload = JSON.stringify({
                        name: "lyrics",
                        args: { file_path: './music/The American Dream Is Killing Me.flac' }
                    });
                    ws.send(requestPayload);
                };

                ws.onmessage = (msg) => {
                    console.log(msg.data)
                };

                ws.onerror = (error) => {
                    console.error("WebSocket error:", error);
                    reject(error);
                };

                ws.onclose = () => {
                    const fileBlob = combineFileChunks(fileBufferQueue);
                    resolve(fileBlob);
                };
            }}
        />

        <Player Shared={Shared} />
    </div>;
};

export default Home;
