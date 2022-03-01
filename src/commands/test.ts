import BaseCommand from '../util/BaseCommand.js';
class Test extends BaseCommand {
  run() {
    // const { data, options } = this;
    // console.log(new OCC(data, options).getParsedDate('buyDate'));
    this.helper.inquirer.prompt({
      message: '请选择',
      type: 'list',
      name: 'list',
      choices: ['1', '2']
    });
  }
}

export default (data: any, option: any) => {
  new Test().run();
};
