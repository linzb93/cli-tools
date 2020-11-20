const axios = require('axios');
const dayjs = require('dayjs');
const cheerio = require('cheerio');
const ora = require('ora');
const Chain = require('../lib/Chain');
const { errorLogger, isURL } = require('../lib/util');
const {parseZhihuAnswer, parseZhihuArticle} = require('./parser/zhihu');
const parseJuejinArticle = require('./parser/juejin');

module.exports = async args => {
  const service = await require('./service')();
  const argIsURL = isURL(args[0]);
  let params;
  const spinner = ora('').start();
  if (argIsURL) {
    spinner.text = '正在获取文章内容';
    params = await handleLink(args[0]);
  } else {
    params = {
      title: `memo ${dayjs().format('YYYY-MM-DD h:mm:ss a')}`,
      body: args[0],
      format: null
    };
  }
  spinner.text = '正在将内容保存至语雀';
  try {
    await service.post(`/repos/linzb93/notes/docs`, params);
  } catch (error) {
    errorLogger(error.response.data);
    spinner.fail('上传失败');
    return;
  }
  spinner.succeed(argIsURL ? `文章 ${params.title} 推送成功` : '推送成功');
}

async function handleLink(url) {
  const {data: html} = await axios.get(url);
  const $ = cheerio.load(html);
  const queue = new Chain([
    parseZhihuAnswer,
    parseZhihuArticle,
    parseJuejinArticle,
    parseOtherUrl
  ]);
  return  queue.run(url, $);
}

function parseOtherUrl(url, $) {
  return {
    title: $('title').text(),
    body: `原文：${url}`,
    format: 'markdown'
  }
}