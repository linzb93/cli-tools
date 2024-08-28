import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Koa from "koa";
import open from "open";
import Router from "koa-router";
import cors from "@koa/cors";
import serve from "koa-static-server";
import { omit } from "lodash-es";
import { bodyParser } from "@koa/bodyparser";
import globalConfig from "../../../../config.json";
import monitorRouter from "./controller/monitor";
import iPhoneRouter from "./controller/iPhone";
import settingRouter from "./controller/setting";
import scheduleRouter from "./controller/schedule";
import commonAPIs from "./controller/common";

const app = new Koa();
const apiRouter = new Router({
  prefix: "/api",
});
const menu = getCommandArgValue("menu");
const shouldOpen = getCommandArgValue("open");

apiRouter.use(async (ctx, next) => {
  await next();
  if (!ctx.body || !ctx.body.code || ctx.body.code === 200) {
    ctx.body = {
      code: 200,
      result: omit(ctx.body, ["code"]),
    };
  }
});
app.use(bodyParser());
app.use(cors());
app.use(
  serve({
    rootDir: join(
      dirname(fileURLToPath(import.meta.url)),
      globalConfig.prefix.static
    ),
    rootPath: `/${globalConfig.prefix.static}`,
  })
);
commonAPIs(apiRouter);
apiRouter.use(monitorRouter.routes());
apiRouter.use(iPhoneRouter.routes());
apiRouter.use(settingRouter.routes());
apiRouter.use(scheduleRouter.routes());
app.use(apiRouter.routes());
app.listen(globalConfig.port.production, async () => {
  if (menu) {
    await open(
      `http://localhost:${globalConfig.port.production}/${globalConfig.prefix.static}#${menu}`
    );
  } else if (shouldOpen) {
    await open(
      `http://localhost:${globalConfig.port.production}/${globalConfig.prefix.static}`
    );
  }
  process.send?.("ok");
});

function getCommandArgValue(key: string) {
  const args = process.argv.slice(2);
  const match = args.find((arg) => arg.startsWith(`--${key}`));
  if (match) {
    const replaced = match.replace(`--${key}`, "");
    if (replaced === "") {
      return true;
    }
    if (!isNaN(Number(replaced))) {
      return Number(replaced);
    }
    if (replaced === "true") {
      return true;
    }
    if (replaced === "false") {
      return false;
    }
    return replaced;
  }
  return "";
}
