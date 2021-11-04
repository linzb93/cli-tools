const axios = require('axios');
const open = require('open');
const ora = require('ora');
const clipboard = require('clipboardy');
const { sleep } = require('./lib/util');

const map = {
    default: {
        appKey: '4',
        serviceName: '经营神器-美团',
        testId: '15983528161'
    },
    zx: {
        appKey: '36',
        serviceName: '装修神器-美团',
        testId: '16159400501'
    }
};
module.exports = async (input, options) => {
    const service = axios.create({
        baseURL: 'https://api.diankeduo.cn/zhili/occ/order'
    });
    let match;
    let shopId;
    const spinner = ora('正在搜索店铺').start();
    if (input.length === 0) {
        match = map.default;
        shopId = match.testId;
    } else if (input.length === 1) {
        if (isNaN(Number(input[0]))) {
            match = map.zx;
            shopId = match.testId;
        } else {
            match = map.default;
            shopId = input[0];
        }
    } else if (input.length === 2) {
        match = map[input[1]];
        shopId = input[0];
    }
    const { data: listData } = await service.post('/getOrderInfoList', {
        appKey: match.appKey,
        pageIndex: 1,
        pageSize: 2,
        param: shopId,
        platform: 8,
        serviceName: match.serviceName
    });
    if (!listData.result.list.length) {
        spinner.fail('未找到店铺');
        return;
    }
    const { memberId, memberName } = listData.result.list[0];
    if (options.token) {
        spinner.text = `正在获取token:${memberName}`;
    } else {
        spinner.text = `正在打开店铺:${memberName}`;
    }
    await sleep(1500);
    const { data: { result } } = await service.post('/replaceUserLogin', {
        appKey: match.appKey,
        memberId,
        platform: 8,
        specificationId: 'v3'
    });
    if (options.token) {
        const { hash } = new URL(result);
        const token = hash.replace('#/login?code=', '');
        clipboard.writeSync(token);
        spinner.succeed(`已复制店铺 ${memberName} 的token`);
    } else {
        spinner.succeed('打开成功');
        open(result);
    }
};
