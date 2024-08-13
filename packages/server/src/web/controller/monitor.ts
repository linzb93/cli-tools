import { Request } from "@/typings/api";
import sql from "@/provider/sql";

// 获取项目列表
export const getApps = async () => {
  let list = await sql((db) => db.monitor);
  return {
    list: list || [],
  };
};

// 保存已选的项目列表
export const saveApps = async (
  req: Request<{ siteId: string; name: string }[]>
) => {
  const { params } = req;
  await sql((db) => {
    db.monitor = params;
  });
  return null;
};
