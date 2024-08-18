import Router from "koa-router";
import sql from "@/provider/sql";

const router = new Router();

router.post("/getSetting", async (ctx) => {
  const result = await sql((db) => ({
    ipc: db.ipc,
    oaApiPrefix: db.oa ? db.oa.apiPrefix : "",
    user: db.sync ? db.sync.user : "",
    password: db.sync ? db.sync.password : "",
  }));
  ctx.body = result;
});
router.post("/saveSetting", async (ctx) => {
  const params = ctx.body;
  await sql((db) => {
    db.ipc = params.ipc;
    if (db.oa) {
      db.oa.apiPrefix = params.oaApiPrefix;
    } else {
      //@ts-ignore
      db.oa = {
        apiPrefix: params.oaApiPrefix,
      };
    }
    db.sync = {
      user: params.user,
      password: params.password,
    };
  });
  return null;
});

export default router;
