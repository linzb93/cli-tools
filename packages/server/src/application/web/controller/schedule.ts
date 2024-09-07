import Router from "koa-router";
import sql from "@/common/sql";
import { HTTP_STATUS } from "@/common/constant";
import useScan from "@/common/git/useScan";
import sse from "koa-sse-stream";

const router = new Router({
  prefix: "/schedule",
});

router;

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

router.get("/gitScanResult", async (ctx) => {
  // const schedule = await sql(async (db) => db.schedule);
  // if (!schedule) {
  //   ctx.body = {
  //     code: HTTP_STATUS.BAD_REQUEST,
  //     message: "未初始化，请选择要扫描的文件夹",
  //   };
  //   return;
  // }
  // const [counter$, list$] = await useScan();
  // counter$.subscribe((count) => {
  //   ctx.res.write(`${count}\n\n`);
  // });
  // list$.subscribe((list: any) => {
  //   ctx.res.end({
  //     list: list.filter((item) => ![0, 3].includes(item.status)),
  //   });
  // });
  ctx.body = {
    list: [],
  };
});

export default router;
