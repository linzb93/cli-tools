import BaseCommand from '../util/BaseCommand.js';
class Test extends BaseCommand {
  private data: any;
  private options: any;
  constructor(data: any, options: any) {
    super();
    this.data = data;
    this.options = options;
  }
  run() {
    const { options } = this;
    // console.log(new OCC(data, options).getParsedDate('buyDate'));
    console.log(options);
  }
}

export default (data: any, option: any) => {
  new Test(data, option).run();
};
