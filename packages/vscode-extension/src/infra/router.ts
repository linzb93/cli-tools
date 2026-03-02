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
    data: {
        path: string;
        query: AnyObject;
    }
) => {
    const match = database.find((item) => item.path === data.path);
    if (match) {
        const response = await match.callback(data.query || {});
        return response;
    }
    return { status: 'error', message: `Unknown path: ${data.path}` };
};

const post = <T = AnyObject>(path: string, callback: Callback<T>) => {
    database.push({ path, callback } as Route);
};

const router = {
    register,
    post,
};
export default router;
