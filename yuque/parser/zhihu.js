function parseAnswer(url, $, next) {
    if (url.includes('zhihu.com') && url.includes('answer/')) {
        const pageTitles = $('title').text().split('-');
        const html = filterHTML($('.RichContent-inner').first().html());
        return {
            title: `${pageTitles[0]} - ${$('.UserLink-link').eq(1).text()}的回答 - ${pageTitles[1]}`,
            body: `原文： ${url}
      ${html}`,
            format: 'lake'
        };
    }
    return next(url, $);
}
function parseArticle(url, $, next) {
    if (url.includes('zhuanlan.zhihu.com')) {
        const html = filterHTML($('.Post-RichText').html());
        return {
            title: $('title').text(),
            body: `原文： ${url}
      ${html}`,
            format: 'lake'
        };
    }
    return next(url, $);
}

/**
 * 1. 把里面webp预览图换成webp图片
 * 2. 把里面没用的“<img src="data:image/svg+xml... />”标签给去掉
 */
function filterHTML(html) {
    return html
        .replace(/^<img class="ztext-gif".+(\.jpg)/g, match => match.replace('.jpg', '.webp'))
        .replace(/<img src="data:image.+?">/g, '');
}

module.exports = {
    parseZhihuAnswer: parseAnswer,
    parseZhihuArticle: parseArticle
};
