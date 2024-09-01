import { sequenceExec } from "@/common/promiseFn";
import logger from "@/common/logger";
import gitAtom from "@/common/git/atom";
import { CommandItem } from "@/common/promiseFn";

export default async () => {
  const actionObj = gitAtom.push() as CommandItem;
  await sequenceExec([
    {
      ...actionObj,
      retryTimes: 30,
    },
  ]);
  logger.success("代码推送成功");
};
