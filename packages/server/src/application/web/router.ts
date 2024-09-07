import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express, { Router } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import globalConfig from "../../../../../config.json";
import monitorRouter from "./controller/monitor";
import iPhoneRouter from "./controller/iPhone";
import settingRouter from "./controller/setting";
import scheduleRouter from "./controller/schedule";
import vueRouter from "./controller/vue";
import commonAPIs from "./controller/common";
import schedule from "./schedule";
import CgSchedule from "./schedule/Cg";

const app = express();
const apiRouter = Router();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: "5mb" }));
app.use(cors());
app.use(
  `/${globalConfig.prefix.static}`,
  express.static(
    join(dirname(fileURLToPath(import.meta.url)), globalConfig.prefix.static)
  )
);

commonAPIs(apiRouter);
apiRouter.use("/monitor", monitorRouter);
apiRouter.use("/iPhone", iPhoneRouter);
apiRouter.use("/setting", settingRouter);
apiRouter.use("/schedule", scheduleRouter);
apiRouter.use("/vue", vueRouter);
app.use("/api", apiRouter);

// 注册定时任务
schedule.register(CgSchedule);
schedule.start();

app.listen(globalConfig.port.production, async () => {
  process.send?.("ok");
});
