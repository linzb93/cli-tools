import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
const app = express();

app.use(bodyParser.json());
app.use(cors());

app.post('vue/build', (req, res) => {
    res.send('build vue project');
});

app.listen(9627, () => {
    console.log('Server is running on port 9627');
});
