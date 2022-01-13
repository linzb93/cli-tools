const inquirer = require('inquirer');
const ora = require('ora');
const pMap = require('p-map');
const { reactive } = require('@vue/reactivity');
const { watch } = require('@vue/runtime-core');
const logger = require('../../../util/logger');
const git = require('../../../util/git');

module.exports = async () => {
    const tags = await git.tag();
    if (!tags.length) {
        logger.info('没有tag可以删除');
        return;
    }
    logger.clearConsole();
    const { selected } = await inquirer.prompt({
        message: '请选择需要删除的tag',
        name: 'selected',
        type: 'checkbox',
        choices: tags
    });
    if (selected.length) {
        const spinner = ora('开始删除').start();
        const successTags = reactive([]);
        const errorTags = reactive([]);
        watch(successTags, value => {
            spinner.text = `删除成功${value.length}个，失败${errorTags.length}个`;
        });
        watch(errorTags, value => {
            spinner.text = `删除成功${successTags.length}个，失败${value.length}个`;
        });
        await pMap(selected, async tag => {
            try {
                await Promise.all([
                    git.deleteTag(tag),
                    git.deleteTag(tag, { includeRemote: true })
                ]);
            } catch (error) {
                errorTags.push({
                    tag,
                    errorMessage: error.message
                });
                return;
            }
            successTags.push(tag);
        }, { concurrency: 5 });
        spinner.succeed();
        if (errorTags.length) {
            logger.error(errorTags);
        }
        return;
    }
    logger.info('未选中需要删除的tag');
};
