const fileStream = (filePath) => {
    return new Promise((resolve, reject) => {
        const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${location.base || '/'}websocket`;
        const ws = new WebSocket(url);

        ws.onopen = () => {
            const requestPayload = JSON.stringify({
                title: "file_stream",
                args: { filepath: filePath }
            });
            ws.send(requestPayload);
        };

        ws.binaryType = 'arraybuffer';
        let fileBufferQueue = [];

        ws.onmessage = (event) => {
            if (event.data instanceof ArrayBuffer) {
                fileBufferQueue.push(event.data);
            } else {
                const message = JSON.parse(event.data);
                console.log(message);

                if (message.status === "completed") {
                    console.log("Streaming completed.");
                    ws.close();
                } else if (message.status === "error") {
                    console.error("Error:", message.message);
                    ws.close();
                    reject(message.message);
                }
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            reject(error);
        };

        ws.onclose = () => {
            console.log("WebSocket connection closed.");
            const fileBlob = combineFileChunks(fileBufferQueue);
            resolve(fileBlob);
        };

        const combineFileChunks = (fileBufferQueue) => {
            const fileBlob = new Blob(fileBufferQueue);
            return fileBlob;
        };
    });
};

export default fileStream;