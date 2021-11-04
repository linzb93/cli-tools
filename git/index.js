const git = require('./_internal/git');
const logger = require('../lib/logger');
module.exports = async () => {
    await git();
    logger.done('提交完成');
};
