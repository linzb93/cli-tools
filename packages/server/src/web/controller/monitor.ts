import Router from "koa-router";
import sql from "@/provider/sql";

const router = new Router();
export default router;
// 获取项目列表
router.post("/monitor/getApps", async (ctx) => {
  let list = await sql((db) => db.monitor);
  ctx.body = list || [];
});

// 保存已选的项目列表
router.post("/monitor/saveApps", async (ctx) => {
  await sql((db) => {
    db.monitor = ctx.body;
  });
});
