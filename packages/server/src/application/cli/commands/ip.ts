import Ip, { Options } from '@/service/ip';

// function generateHelp() {
//   generateHelpDoc({
//     title: "ip",
//     content: `查询本机内网/公网IP，或者查询IP归属地
// 使用方法：
// ip - 查询本机内网和公网IP
// ip get '127.0.0.1' - 查询IP归属地`,
//   });
// }

export default (data: string[], options: Options) => {
    new Ip().main(data);
};
