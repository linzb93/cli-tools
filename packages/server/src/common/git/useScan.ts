import sql from "@/common/sql";
import { join } from "node:path";
import pReduce from "p-reduce";
import * as gitUtil from "./index";
import fsp from "node:fs/promises";
import pMap from "p-map";
import { Observable, last, skipLast } from 'rxjs';

export default async function useScan() {
  const schedule = await sql(async (db) => db.schedule);
  const allDirs = await pReduce(
    schedule.gitDirs,
    async (acc, dir) => {
      const dirs = await fsp.readdir(dir.path);
      return acc.concat(
        await pMap(dirs, async (subDir) => {
          return {
            dir: subDir,
            prefix: dir.path,
            folderName: dir.name,
          };
        }, { concurrency: 4 })
      );
    },
    []
  );
  const obs$ = new Observable(observer => {
    let counter = 0;
    pMap(
      allDirs,
      async (dirInfo) => {
        const full = join(dirInfo.prefix, dirInfo.dir);
        const status = await gitUtil.getPushStatus(full);
        counter += 1;
        observer.next(counter);
        return {
          name: dirInfo.dir,
          path: full,
          folderName: dirInfo.folderName,
          status,
        };
      },
      { concurrency: 5 }
    )
      .then(list => {
        observer.next(list.filter(item => [1, 2, 4].includes(item.status)));
        observer.complete();
      });
  });
  return [
    obs$.pipe(skipLast(1)),
    obs$.pipe(last())
  ]
}
