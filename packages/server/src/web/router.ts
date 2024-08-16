import {dirname, join} from 'node:path';
import { fileURLToPath } from 'node:url';
import Koa from "koa";
import cors from "@koa/cors";
import serve from "koa-static-server";
import { omit } from "lodash-es";
import { bodyParser } from "@koa/bodyparser";
import globalConfig from "../../../../config.json";
import ossRouter from "./controller/oss";
import monitorRouter from "./controller/monitor";

const app = new Koa();
app.use(async (ctx, next) => {
  await next();
  if (ctx.request.path.startsWith('/pages')) {
    return;
  }
  if (!ctx.body || !ctx.body.code || ctx.body.code === 200) {
    ctx.body = {
      code: 200,
      result: omit(ctx.body, ["code"]),
    };
  }
});
app.use(bodyParser());
app.use(cors());
app.use(serve({
  rootDir: join(dirname(fileURLToPath(import.meta.url)), "pages"),
  rootPath: '/pages'
}));
app.use(ossRouter.routes()).use(ossRouter.allowedMethods());
app.use(monitorRouter.routes()).use(monitorRouter.allowedMethods());

app.listen(globalConfig.port.production, () => {
  console.log(`服务在${globalConfig.port.production}端口启动。`)
});
