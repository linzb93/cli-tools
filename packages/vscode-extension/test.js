// 连接socket，端口号7001
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:7001');
ws.on('open', () => {
    console.log('Connected to server!');
    ws.send(
        JSON.stringify({
            path: 'nvm-switch',
            query: {
                version: '14',
            },
        })
    );
});
ws.on('message', (message) => {
    console.log(`Received message => ${message}`);
    ws.close();
});
ws.on('error', err => {
    console.log(err)
})
