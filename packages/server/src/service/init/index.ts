import dayjs from "dayjs";
import fs from "fs-extra";
import logger from "@/common/logger";
import { Command } from "commander";
// import Server from "@/service/server";
import sql from "@/common/sql";
import { tempPath } from "@/common/constant";
import { sleep } from "@linzb93/utils";
export default async (command: Command) => {
  // 记录每次使用的命令
  logger.cli(command.args.join(" "));
  await sleep(500);
  const lastModifiedTime = await sql((db) => db.lastModifiedTime);
  if (Math.abs(dayjs().diff(lastModifiedTime, "d")) < 1) {
    return;
  }
  await sql((db) => {
    db.lastModifiedTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
  });
  // 清空缓存目录
  await fs.emptyDir(tempPath);

  // new Server().main();
};
