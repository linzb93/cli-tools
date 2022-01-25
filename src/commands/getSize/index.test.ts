// const sleep = (time:number) => new Promise(resolve => setTimeout(resolve, time));
import GetSize from './index';
test('delay',  async() => {
    let count = 0;
    const ret = await new GetSize('https://pic4.zhimg.com/v2-dc0e0b0e75dfd3365c37c1dc41521c1c_720w.jpg').run();
    expect(count).toBe('41.56KB');
});