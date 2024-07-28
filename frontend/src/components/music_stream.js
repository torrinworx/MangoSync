const streamMusicViaWebSocket = async (songPath) => {
    const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${location.base || '/'}websocket`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
        const requestPayload = JSON.stringify({
            title: "stream_music",
            args: { filepath: songPath }
        });
        ws.send(requestPayload);
    };

    ws.binaryType = 'arraybuffer'; // Ensure the WebSocket treats binary data as ArrayBuffer

    let audioBuffer = []; // To store the chunks of audio data

    ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
            audioBuffer.push(event.data);
        } else {
            const message = JSON.parse(event.data);
            console.log(message);

            if (message.status === "completed") {
                console.log("Streaming completed.");
                ws.close();
            } else if (message.status === "error") {
                console.error("Error:", message.message);
                ws.close();
            }
        }
    };

    ws.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
        console.log("WebSocket connection closed.");
        processAudioStream(audioBuffer);
    };

    const processAudioStream = (audioBuffer) => {
        // Combine all the chunks of audio data
        const audioBlob = new Blob(audioBuffer, { type: 'audio/*' });
        return audioBlob;
    };

    return new Promise((resolve) => {
        ws.onclose = () => {
            console.log("WebSocket connection closed.");
            const audioBlob = processAudioStream(audioBuffer);
            resolve(audioBlob);
        };
    });
};

export default streamMusicViaWebSocket;
