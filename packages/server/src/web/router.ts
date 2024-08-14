import Koa from "koa";
import cors from "@koa/cors";
import { omit } from "lodash-es";
import { bodyParser } from "@koa/bodyparser";
import globalConfig from "../../../../config.json";
import ossRouter from "./controller/oss";
import monitorRouter from "./controller/monitor";

const app = new Koa();
app.use(async (ctx, next) => {
  await next();
  if (!ctx.body.code || ctx.body.code === 200) {
    ctx.body = {
      code: 200,
      result: omit(ctx.body, ["code"]),
    };
  }
});
app.use(bodyParser());
app.use(cors());

app.use(ossRouter.routes()).use(ossRouter.allowedMethods());
app.use(monitorRouter.routes()).use(monitorRouter.allowedMethods());

app.listen(globalConfig.port.production);
