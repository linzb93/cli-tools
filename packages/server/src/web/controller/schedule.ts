import fsp from "node:fs/promises";
import { join } from "node:path";
import pReduce from "p-reduce";
import Router from "koa-router";
import pMap from "p-map";
import * as gitUtil from "@/provider/git/index";
import sql from "@/provider/sql";
import { HTTP_STATUS } from "@/provider/constant";

const router = new Router({
  prefix: "/schedule",
});

// 获取项目列表
router.post("/get", async (ctx) => {
  ctx.body = await sql((db) => db.schedule);
});
// 保存已选的项目列表
router.post("/save", async (ctx) => {
  const params = ctx.body;
  await sql((db) => {
    db.schedule = {
      ...params,
      inited: true,
    };
  });
  return null;
});

router.post("/gitScanResult", async () => {
  const schedule = await sql(async (db) => db.schedule);
  if (!schedule) {
    return {
      code: HTTP_STATUS.BAD_REQUEST,
      message: "未初始化，请选择要扫描的文件夹",
    };
  }
  const { git } = schedule;
  const allDirs = await pReduce(
    git.dirs,
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
  const result = await pMap(
    allDirs,
    async (dirInfo) => {
      const full = join(dirInfo.prefix, dirInfo.dir);
      return {
        name: dirInfo.dir,
        path: full,
        folderName: dirInfo.folderName,
        status: await gitUtil.getPushStatus(full),
      };
    },
    { concurrency: 5 }
  );
  return {
    list: result.filter((item) => ![0, 3].includes(item.status)),
  };
});

export default router;
