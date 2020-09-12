class Chain {
  constructor(list) {
    this.list = list;
    this.index = 0;
    this.next = this.next.bind(this);
  }
  next(...args) {
    return this.list[++this.index](...args, this.next);
  }
  run(...args) {
    return this.list[0](...args, this.next);
  }
}

module.exports = Chain;