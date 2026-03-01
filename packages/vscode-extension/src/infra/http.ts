import * as http from 'http';
import { ExtensionContext } from 'vscode';
import router from './router';

const port = 7001;
let server: http.Server;

const init = (context: ExtensionContext) => {
    try {
        server = http.createServer(async (req, res) => {
            // Set CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            if (req.method !== 'POST') {
                res.writeHead(405, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: 'Method Not Allowed' }));
                return;
            }

            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    const payload = JSON.parse(body);
                    const result = await router.register(payload);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result || { status: 'success' }));
                } catch (error) {
                    console.error('Error processing request:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', message: 'Internal Server Error' }));
                }
            });
        });

        server.listen(port, () => {
            console.log(`HTTP server listening on port ${port}`);
        });

        server.on('error', (e: any) => {
             if (e.code === 'EADDRINUSE') {
                console.log(`Port ${port} is already in use.`);
            } else {
                console.error('HTTP server error:', e);
            }
        });

        context.subscriptions.push({
            dispose: () => {
                close();
            }
        });

    } catch (error) {
        console.error('Failed to create HTTP server:', error);
    }
};

const close = () => {
    if (server) {
        server.close();
    }
};

export const httpManager = {
    init,
    close
};
