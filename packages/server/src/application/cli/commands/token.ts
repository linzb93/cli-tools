import Token, { Options } from '@/service/token';

// function generateHelp() {
//   generateHelpDoc({
//     title: "token",
//     content: `解析token，会将时间戳转化为标准格式。
// 示例：
// token <token>
// 参数：
// - origin: 不转换时间戳
// - complete: 获取完整的解析结果，包括算法`,
//   });
// }

export default (data: string, options: Options) => {
    return new Token().main(data, options);
};
