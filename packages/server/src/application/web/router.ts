process.on('unhandledRejection', (e) => {
    process.send?.({
        type: 'message',
        message: e,
    });
});
process.on('unhandledRejection', (e) => {
    process.send?.({
        type: 'message',
        message: e,
    });
});

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
/**
 * 不要用Koa，生态太差了，不如express
 */
import express, { Router } from 'express';
import { tempPath } from '@/common/constant';
import cors from 'cors';
import bodyParser from 'body-parser';
import globalConfig from '../../../../../config.json';
import monitorRouter from './controller/monitor';
import iPhoneRouter from './controller/iPhone';
import diffRouter from './controller/diff';
import AiRouter from './controller/ai';
import settingRouter from './controller/setting';
import scheduleRouter from './controller/schedule';
import vueRouter from './controller/vue';
import commonAPIs from './controller/common';
// import schedule from "./schedule";
// import CgSchedule from "./schedule/Cg";
// import registerSocket from "./socket";

const app = express();
const apiRouter = Router();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(cors());
app.use(
    `/${globalConfig.prefix.static}`,
    express.static(join(dirname(fileURLToPath(import.meta.url)), globalConfig.prefix.static))
);
app.use(globalConfig.prefix.temp, express.static(tempPath));

commonAPIs(apiRouter);
apiRouter.use('/monitor', monitorRouter);
apiRouter.use('/iPhone', iPhoneRouter);
apiRouter.use('/ai', AiRouter);
apiRouter.use('/diff', diffRouter);
apiRouter.use('/setting', settingRouter);
apiRouter.use('/schedule', scheduleRouter);
apiRouter.use('/vue', vueRouter);
app.use('/api', apiRouter);

// 注册定时任务
// schedule.register(CgSchedule);
// schedule.start();

const server = http.createServer(app);
// registerSocket(server);

server.listen(globalConfig.port.production, async () => {
    process.send?.({
        type: 'quit',
    });
});
