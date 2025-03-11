import { Subject } from 'rxjs';
import { type Writable } from 'node:stream';
export const fromStream = (stream: Writable) => {
    const task = new Subject();

    stream.on('data', (data) => {
        task.next(data);
    });
    stream.on('finish', () => {
        task.complete();
    });
    return task;
};
