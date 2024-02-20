import BaseCommand from '../util/BaseCommand.js';
import { connectService } from '../util/service/index.js';
class Test extends BaseCommand {
  async run() {
    const scheduleConnect = await connectService('schedule');
    scheduleConnect.send({
      sendToMainService: true,
      action: 'notify',
      interval: '1m',
      times: 3,
      params: `测试通信`
    });
    scheduleConnect.disconnect();
  }
}

export default () => {
  new Test().run();
};
