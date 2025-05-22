import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import config from '../../../../config.json';
import bug from './controllers/bug';
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/bug', bug);

app.listen(config.port.production, () => {
    process.send?.('server-start');
});
