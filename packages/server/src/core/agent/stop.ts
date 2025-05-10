// import kill from "../../application/cli/commands/kill";
// import BaseCommand from "../../application/cli/shared/BaseCommand";
// import { CacheItem } from ".";
// import * as helper from "../../application/cli/shared/helper";
// interface DbData {
//   items: Required<CacheItem>[];
// }

// class Stop extends BaseCommand {
//   async run() {
//     const db = helper.createDB("agent");
//     const cacheData = (db.data as DbData).items;
//     const matches = cacheData.filter((item) => item.port);
//     if (matches.length === 1) {
//       await kill(["port", matches[0].port]);
//       delete (matches[0] as CacheItem).port;
//       (db.data as DbData).items = cacheData;
//       await db.write();
//     } else if (matches.length > 1) {
//       const { ports } = await this.inquirer.prompt([
//         {
//           type: "checkbox",
//           message: "请选择要关闭的进程",
//           name: "ports",
//           choices: matches.map((item) => ({
//             name: `${item.name || ""}(port:${item.port})`,
//             value: item.port,
//           })),
//         },
//       ]);
//       for (const port of ports) {
//         kill(["port", port]);
//         cacheData.forEach((item) => {
//           if (item.port === port) {
//             delete (item as CacheItem).port;
//           }
//         });
//         await db.write();
//       }
//       // @ts-ignore
//       (db.data as DbData).items = cacheData;
//       await db.write();
//     } else {
//       this.logger.info("没有要关闭的进程");
//       return;
//     }
//   }
// }

// export default () => {
//   new Stop().run();
// };
