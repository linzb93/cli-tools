import BaseCommand from '../../util/BaseCommand.js';
class Help extends BaseCommand {
  private md: string;
  constructor(md: string) {
    super();
    this.md = md;
  }
  async run() {
    const { md } = this;
    this.helper.generateHelpDoc('vue', md, [
      { title: 'serve', description: '开启服务器' },
      {
        title: 'build',
        description: '打包项目并开启服务器',
        options: [
          { title: '--prod', description: '设置为生产环境，默认是测试环境' },
          {
            title: '-f, --force',
            description:
              '是否在已启动服务器时强制覆盖原有文件，默认不重新打包，直接使用原先的项目代码'
          },
          { title: '-c, --copy', description: '复制项目服务器地址' }
        ]
      },
      {
        title: 'stop',
        description: '关闭服务器',
        options: [
          {
            title: '--all',
            description: '关闭全部'
          }
        ]
      }
    ]);
  }
}

export default (md: string) => {
  new Help(md).run();
};
