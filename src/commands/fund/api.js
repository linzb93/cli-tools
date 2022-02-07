const axios = require('axios');

const service = axios.create({
  baseURL: 'https://fundmobapi.eastmoney.com',
  params: {
    deviceid: 'Wap',
    plat: 'Wap',
    product: 'EFund',
    version: '6.2.5',
    _: new Date().getTime()
  }
});

service.interceptors.response.use(
  (res) => {
    if (res.data.Datas === null) {
      throw new Error('');
    }
    return res.data;
  },
  (err) => Promise.reject(err)
);

// 获取基金信息与累计净值
exports.getFundInfo = ({ code, buyDate }) =>
  service.post('/getFundInfo', {
    code,
    buyDate
  });

// 获取基金今日分时涨幅
exports.getFundInfo = ({ FCODE }) =>
  service({
    url: '/FundMApi/FundVarietieValuationDetail.ashx',
    params: {
      FCODE
    }
  });
// eslint-disable-next-line jsdoc/require-param
/**
 * 获取基金净值与涨跌幅
 * y 月；3y 季；6y 半年；n 年；3n 3年；5n 5年
 */
exports.getFundNetDiagram = ({ FCODE, RANGE }) =>
  service({
    url: '/FundMApi/FundNetDiagram.ashx',
    params: {
      FCODE,
      RANGE
    }
  });
// 获取基金基础信息
exports.getFundBaseTypeInformation = (FCODE) =>
  service({
    url: '/FundMApi/FundBaseTypeInformation.ashx',
    params: {
      FCODE
    }
  });
// 获取往期基金经理列表
exports.getFundManagerList = ({ FCODE }) =>
  service({
    url: '/FundMApi/FundManagerList.ashx',
    params: {
      FCODE
    }
  });
// 获取当前基金经理详情
exports.getFundMangerDetail = ({ FCODE }) =>
  service({
    url: '/FundMApi/FundMangerDetail.ashx',
    params: {
      FCODE
    }
  });
// 获取基金持仓
exports.getFundMNInverstPosition = ({ FCODE }) =>
  service({
    url: '/FundMNewApi/FundMNInverstPosition',
    params: {
      FCODE
    }
  });
// 获取基金排名
exports.getFundNMRankNewList = () =>
  service({
    url: '/FundMNewApi/FundMNRankNewList',
    params: {
      fundtype: 0,
      SortColumn: 'RZDF',
      Sort: 'desc',
      pageIndex: 1,
      pagesize: 30
    }
  });
// 获取基金阶段涨幅
exports.getFundStageIncreasement = ({ FCODE }) => {
  return service({
    url: `https://j5.fund.eastmoney.com/sc/tfs/qt/v2.0.1/${FCODE}.json`
  })
    .then((res) => {
      return res.JDZF;
    })
    .catch((e) => {
      return Promise.reject(e);
    });
};
