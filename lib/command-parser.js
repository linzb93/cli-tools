module.exports = argv => {
  let args, flag;
  if (argv[1] && argv[1].indexOf('-') === 0) {
    args = argv.slice(2);
    flag = argv[1].replace('-', '');
  } else {
    args = argv.slice(1);
  }
  return {
    type: argv[0],
    flag,
    args
  }
}