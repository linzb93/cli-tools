export const levelCharacters = {
    border: '|',
    contain: '├',
    line: '─',
    last: '└',
};

/**
 * 颜色映射表
 */
export const COLOR_MAP = {
    red: '#f00',
    yellow: '#ff0',
    orange: '#ffa500',
    blue: '#0000ff',
    lightBlue: '#add8e6',
    green: '#00ff00',
    lightGreen: '#90ee90',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    white: '#fff',
    black: '#000',
    pink: '#ffc0cb',
    purple: '#800080',
    coffee: '#808040',
    brown: '#8b4513',
};
/**
 * 默认浏览器请求头，避免被网站识别非浏览器访问而禁止。
 */
export const defaultBrowserHeaders = {
    'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
};
