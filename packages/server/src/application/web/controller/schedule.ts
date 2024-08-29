import fsp from "node:fs/promises";
import { join } from "node:path";
import pReduce from "p-reduce";
import Router from "koa-router";
import pMap from "p-map";
import * as gitUtil from "@/common/git/index";
import sql from "@/common/sql";
import { HTTP_STATUS } from "@/common/constant";

const router = new Router({
  prefix: "/schedule",
});

// 获取项目列表
router.post("/get", async (ctx) => {
  ctx.body = await sql((db) => db.schedule);
});
// 保存已选的项目列表
router.post("/save", async (ctx) => {
  const params = ctx.request.body;
  await sql((db) => {
    db.schedule = {
      ...params,
      inited: true,
    };
  });
  return null;
});

router.post("/gitScanResult", async (ctx) => {
  const schedule = await sql(async (db) => db.schedule);
  if (!schedule) {
    ctx.body = {
      code: HTTP_STATUS.BAD_REQUEST,
      message: "未初始化，请选择要扫描的文件夹",
    };
    return;
  }
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
  ctx.body = {
    list: result.filter((item) => ![0, 3].includes(item.status)),
  };
});

export default router;
