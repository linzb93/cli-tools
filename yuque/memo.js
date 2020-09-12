const axios = require('axios');
const moment = require('moment');
const cheerio = require('cheerio');
const ora = require('ora');
const Chain = require('../lib/Chain');
const { errorLogger, isURL } = require('../lib/util');

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
      title: `memo ${moment().format('YYYY-MM-DD h:mm:ss a')}`,
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
    parseOtherUrl
  ]);
  return  queue.run(url, $);
}

function parseZhihuAnswer(url, $, next) {
  if (url.includes('zhihu.com') && url.includes('answer/') ) {
    const pageTitles = $('title').text().split('-');
    html = filterHTML($('.RichContent-inner').first().html());
    return {
      title: `${pageTitles[0]} - ${$('.UserLink-link').eq(1).text()}的回答 - ${pageTitles[1]}`,
      body: `原文： ${url}
      ${html}`,
      format: 'lake'
    }
  }
  return next(url, $);
}
function parseZhihuArticle(url, $, next) {
  if (url.includes('zhuanlan.zhihu.com')) {
    const html = filterHTML($('.Post-RichText').html());
    return {
      title: $('title').text(),
      body: `原文： ${url}
      ${html}`,
      format: 'lake'
    }
  }
  return next(url, $);
}
function parseOtherUrl(url, $) {
  return {
    title: $('title').text(),
    body: `原文：${url}`,
    format: 'markdown'
  }
}

/**
 * 1. 把里面webp预览图换成webp图片
 * 2. 把里面没用的“<img src="data:image/svg+xml... />”标签给去掉
 */
function filterHTML(html) {
  return  html
  .replace(/^<img class="ztext-gif".+(\.jpg)/g, match => match.replace('.jpg', '.webp'))
  .replace(/<img src="data:image.+?">/g, '');
}