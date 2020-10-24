function parseJuejinArticle(url, $, next) {
  if (url.includes('juejin.im')) {
    const html = $('.markdown-body').html();
    return {
      title: $('.article-title').text().trim(),
      body: `原文： ${url}
      ${html}`,
      format: 'lake'
    }
  }
  return next(url, $);
}

module.exports = parseJuejinArticle;