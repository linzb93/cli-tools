const execa = require('execa');
const logger = require('../lib/logger');
module.exports = async () => {
    const { stdout } = await execa('git', [ 'status' ]);
    console.log(stdout);
    logger.done('提交完成');
};
