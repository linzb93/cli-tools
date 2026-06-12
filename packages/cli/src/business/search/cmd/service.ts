import fs from 'fs-extra';
import { join } from 'node:path';
import through from 'through2';
import { concatMap, from, interval, first, map } from 'rxjs';
import { fromStream } from '@/utils/help-doc';
import type { Options } from './types';
import { isWin } from '@cli-tools/shared/node';
export async function searchService(options: Options) {}

export function printCmdDocs() {
    return new Promise<void>((resolve) => {
        const docFile = isWin ? 'win.md' : 'macos.md';
        const docPath = join(__dirname, '../search/cmd/docs', docFile);

        const stream = fs.createReadStream(docPath).pipe(
            through(function (chunk, _, callback) {
                this.push(chunk.toString());
                callback();
            }),
        );

        fromStream(stream)
            .pipe(
                map((data) => `${(data as unknown as string).toString()}\n`),
                concatMap((line) =>
                    from(line.split('')).pipe(
                        concatMap((char) =>
                            interval(100).pipe(
                                first(),
                                map(() => char),
                            ),
                        ),
                    ),
                ),
            )
            .subscribe({
                next(data) {
                    process.stdout.write(data);
                },
                complete: () => {
                    resolve();
                },
            });
    });
}
