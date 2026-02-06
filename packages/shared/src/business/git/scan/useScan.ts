import { join } from 'node:path';
import fsp from 'node:fs/promises';
import pMap from 'p-map';
import pReduce from 'p-reduce';
import { Observable, last, skip, skipLast, first } from 'rxjs';
import sql from '@cli-tools/shared/utils/sql';
import { getGitProjectStatus, GitStatusMap } from '../shared/utils';
/**
 * 扫描所有git仓库，返回所有需要push的仓库
 * */
export default async function useScan() {
    const gitDirs = await sql(async (db) => db.gitDirs);
    const allDirs = await pReduce(
        gitDirs,
        async (acc, dir) => {
            const dirs = await fsp.readdir(dir.path);
            return acc.concat(
                await pMap(
                    dirs,
                    async (subDir) => ({
                        dir: subDir,
                        prefix: dir.path,
                        folderName: dir.name,
                    }),
                    { concurrency: 4 },
                ),
            );
        },
        [],
    );
    const obs$ = new Observable((observer) => {
        let counter = 0;
        observer.next(allDirs.length);
        pMap(
            allDirs,
            async (dirInfo) => {
                const full = join(dirInfo.prefix, dirInfo.dir);
                const { status, branchName } = await getGitProjectStatus(full);
                counter += 1;
                observer.next(counter);
                return {
                    name: dirInfo.dir,
                    path: full,
                    folderName: dirInfo.folderName,
                    status,
                    branchName,
                };
            },
            { concurrency: 4 },
        ).then((list) => {
            observer.next(
                list.filter((item) =>
                    [GitStatusMap.Uncommitted, GitStatusMap.Unpushed, GitStatusMap.NotOnMainBranch].includes(
                        item.status,
                    ),
                ),
            );
            observer.complete();
        });
    });
    return {
        total$: obs$.pipe(first()),
        counter$: obs$.pipe(skip(1), skipLast(1)),
        list$: obs$.pipe(last()),
    };
}
