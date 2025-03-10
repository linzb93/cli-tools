import Color, { Options } from '@/service/color';

// function generateHelp() {
//   generateHelpDoc({
//     title: "color",
//     content: `转换颜色显示
// color '#333' => '51,51,51'
// color '255,255,255' => '#fff'`,
//   });
// }

export default function (text: string, options: Options) {
    new Color().main(text, options);
}
