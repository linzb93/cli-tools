// import OCC from './occ.js';
class Test {
  private options: any;
  private data: any;
  constructor(data: any, options: any) {
    this.data = data;
    this.options = options;
  }
  run() {
    // const { data, options } = this;
    // console.log(new OCC(data, options).getParsedDate('buyDate'));
  }
}

export default (data: any, option: any) => {
  new Test(data, option).run();
};
