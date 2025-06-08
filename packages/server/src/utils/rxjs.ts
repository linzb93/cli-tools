import { Subject } from 'rxjs';
import { type Writable } from 'node:stream';

/**
 * 将流转换为RxJS流
 * @returns RxJS流
 */
export const fromStream = (stream: Writable): Subject<unknown> => {
    const task = new Subject<unknown>();

    stream.on('data', (data) => {
        task.next(data);
    });
    stream.on('finish', () => {
        task.complete();
    });
    return task;
};
