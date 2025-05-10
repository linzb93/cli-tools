// import BaseCommand from "../../shared/BaseCommand";
// import fs from "fs-extra";
// import path from "node:path";
// import * as helper from '../../shared/helper';
// interface DbData {
//   items: {
//     name: string;
//     prefix: string;
//     id: string;
//   }[];
// }

// class Set extends BaseCommand {
//   async run() {
//     const { name, prefix, id } = await this.inquirer.prompt([
//       {
//         message: "请输入名称",
//         type: "input",
//         name: "name",
//       },
//       {
//         message: "请输入前缀",
//         type: "input",
//         name: "prefix",
//       },
//       {
//         message: "请输入项目ID",
//         type: "input",
//         name: "id",
//       },
//     ]);
//     const db = helper.createDB("yapi");
//     await db.read();
//     (db.data as DbData).items.push({
//       name,
//       prefix,
//       id,
//     });
//     await db.write();
//     await fs.writeFile(
//       path.resolve(helper.root, `data/yapi/${id}.json`),
//       '{"item": []}'
//     );
//     this.logger.success(`${name}项目创建成功`);
//   }
// }

// export default () => {
//   new Set().run();
// };
