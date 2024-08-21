import Router from "koa-router";
import sql from "@/provider/sql";

const router = new Router({
  prefix: "/monitor",
});
export default router;
// 获取项目列表
router.post("/getApps", async (ctx) => {
  ctx.body = {
    list: (await sql((db) => db.monitor)) || [],
  };
});

// 保存已选的项目列表
router.post("/saveApps", async (ctx) => {
  await sql((db) => {
    db.monitor = ctx.request.body;
  });
});
