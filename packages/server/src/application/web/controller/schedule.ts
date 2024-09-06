import fsp from "node:fs/promises";
import { join } from "node:path";
import pReduce from "p-reduce";
import Router from "koa-router";
import pMap from "p-map";
import * as gitUtil from "@/common/git/index";
import sql from "@/common/sql";
import { HTTP_STATUS } from "@/common/constant";
import useScan from "@/common/git/useScan";

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
  ctx.set('Content-Type', 'text/event-stream');
  ctx.set('Cache-Control', 'no-cache');
  ctx.set('Connection', 'keep-alive');
  const [counter$, list$] = await useScan();
  counter$.subscribe(count => {
    ctx.res.write(count);
  });
  list$.subscribe((list: any) => {
    ctx.res.end(ctx.body = {
      list: list.filter((item) => ![0, 3].includes(item.status)),
    })
  })
});

export default router;
