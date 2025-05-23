import { Subject } from 'rxjs';
import { type Writable } from 'node:stream';
/**
 * 将流转换为RxJS流
 * @param {Writable} stream - 可写流
 * @returns {Subject} RxJS流
 */
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
