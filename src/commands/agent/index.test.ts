import { describe, expect, beforeAll, afterAll } from 'vitest';
import createAgent from '.';
import kill from '../kill';
describe('Agent网站代理功能', it => {
  // 起一个本地的网站，含有接口和图片。
  const port = '3113';
  beforeAll(() => createAgent('', {
    proxy: '',
    port,
    copy: true
  }));
  it('代理接口可以正常访问', () => {

  });
  it.concurrent('代理静态资源正确', () => {
    // 根据npm包mime判断获取的是否是图片
  });
  it.concurrent('端口号正确', () => {
    // 读取这个端口的时候，可以拿到是在进行vitest测试的参数
  });
  it.concurrent('可以复制', () => {
    // 读取剪贴板数据，是不是刚才生成的网址
  });

  afterAll(() => {
    kill([port]);
    // 还有删除刚才创建的数据库文件数据
  });
});
