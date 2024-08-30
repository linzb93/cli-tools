import { basename } from "node:path";
import Router from "koa-router";
import sql from "@/common/sql";
import { showOpenDialog } from "@/common/dialog";
const router = new Router({
  prefix: "/vue",
});

router.post("/getList", async (ctx) => {
  const result = await sql((db) => {
    if (!db.vue) {
      return [];
    }
    return db.vue;
  });
  ctx.body = {
    list: result,
  };
});

router.post("/select", async (ctx) => {
  const dir = await showOpenDialog("directory");
  await sql((db) => {
    if (!db.vue) {
      db.vue = [
        {
          id: 1,
          name: basename(dir),
          path: dir,
        },
      ];
      return;
    }
    const last = db.vue.at(-1);
    const id = last.id + 1;
    db.vue.push({
      id,
      name: basename(dir),
      path: dir,
    });
  });
  ctx.body = {};
});

router.post("/edit", async (ctx) => {
  const { id, name } = ctx.request.body;
  await sql((db) => {
    const match = db.vue.find((item) => item.id === id);
    if (!match) {
      return;
    }
    match.name = name;
  });
  ctx.body = {};
});

router.post("/delete", async (ctx) => {
  const { id } = ctx.request.body;
  await sql((db) => {
    const matchIndex = db.vue.findIndex((item) => item.id === id);
    if (matchIndex > -1) {
      db.vue.splice(matchIndex, 1);
    }
  });
  ctx.body = {};
});

export default router;
