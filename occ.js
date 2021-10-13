const axios = require('axios');
const open = require('open');
const ora = require('ora');
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
module.exports = async input => {
    const service = axios.create({
        baseURL: 'http://occ.diankeduo.net/occ/order'
    });
    let match;
    const spinner = ora('正在搜索店铺').start();
    if (input.length === 0) {
        match = map.default;
    } else if (input.length === 1) {
        if (isNaN(Number(input[0]))) {
            match = map.zx;
        } else {
            match = map.default;
        }
    } else if (input.length === 2) {
        match = map[input[1]];
    }
    const shopId = input.length === 1 && !isNaN(Number(input[0])) ? input[0] : match.testId;
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
    spinner.text = `正在打开店铺:${memberName}`;
    await sleep(1500);
    const { data: { result } } = await service.post('/replaceUserLogin', {
        appKey: match.appKey,
        memberId,
        platform: 8,
        specificationId: 'v3'
    });
    spinner.succeed('打开成功');
    open(result);
};
