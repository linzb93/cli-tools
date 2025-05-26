import express, { Router } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import config from '../../../../config.json';
import bug from './controllers/bug';
import setting from './controllers/setting';
import agent, { agentCallback } from './controllers/agent';
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const router = Router();

router.use('/bug', bug);
router.use('/setting', setting);
router.use('/agent', agent);
app.use('/api', router);
app.all('/agent', agentCallback);

app.listen(config.port.production, () => {
    process.send?.('server-start');
});
