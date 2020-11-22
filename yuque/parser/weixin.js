function parseWeixinArticle(url, $, next) {
  if (url.includes('mp.weixin')) {
    return {
      title: $('meta[property="og:title"]').attr('content'),
      body: `原文： ${url}`,
      format: 'lake'
    }
  }
  return next(url, $);
}

module.exports = parseWeixinArticle;