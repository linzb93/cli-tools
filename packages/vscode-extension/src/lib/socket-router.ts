import { WebSocket } from 'ws';

interface AnyObject {
    [key: string]: any;
}

type Callback<T = AnyObject> = (query: T) => any | Promise<any>;

interface Route<T = AnyObject> {
    path: string;
    callback: Callback<T>;
}

const database: Route[] = [];

const register = async (
    ws: WebSocket,
    data: {
        path: string;
        query: AnyObject;
    }
) => {
    const match = database.find((item) => item.path === data.path);
    if (match) {
        const response = await match.callback(data.query || {});
        if (response) {
            ws.send(JSON.stringify(response));
        }
        return true;
    }
    ws.send(JSON.stringify({ status: 'error', message: `Unknown path: ${data.path}` }));
    return false;
};

const add = <T = AnyObject>(path: string, callback: Callback<T>) => {
    database.push({ path, callback } as Route);
};

const router = {
    register,
    add,
};
export default router;
