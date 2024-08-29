import { shallowRef, ref, shallowReactive } from "@vue/runtime-core";
import sql from "@/common/sql";
import { join } from "node:path";
import pReduce from "p-reduce";
import * as gitUtil from "./index";
import fsp from "node:fs/promises";
import pMap from "p-map";
export default async function useScan() {
  const total = shallowRef(0);
  const counter = shallowRef(0);
  const finished = shallowReactive({
    scanDirs: false,
    scanProjects: false,
  });
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
        })
      );
    },
    []
  );
  finished.scanDirs = true;
  total.value = allDirs.length;

  const result = ref([]);
  result.value = await pMap(
    allDirs,
    async (dirInfo) => {
      const full = join(dirInfo.prefix, dirInfo.dir);
      const status = await gitUtil.getPushStatus(full);
      counter.value += 1;
      return {
        name: dirInfo.dir,
        path: full,
        folderName: dirInfo.folderName,
        status,
      };
    },
    { concurrency: 5 }
  );
  finished.scanProjects = true;
  return {
    counter,
    total,
    finished,
    result,
  };
}
