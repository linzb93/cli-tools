import { omit } from "lodash-es";
import dayjs from "dayjs";
import Router from "koa-router";
import OSS, { OssConfig } from "ali-oss";
import { basename } from "node:path";
import pMap from "p-map";
import sql from "@/provider/sql";
import { HTTP_STATUS } from "@/provider/constant";

const router = new Router({
  prefix: "/oss",
});
export default router;

// 根据id查找对应的OSS客户端
async function findClient(id: number) {
  const accounts = await sql((db) => db.oss.accounts);
  const match = accounts.find((item) => item.id === id);
  if (!match) {
    return {
      code: HTTP_STATUS.BAD_REQUEST,
      message: "OSS不存在",
    };
  }
  const ossobj = omit(match, ["platform", "name"]) as unknown as OssConfig;
  return {
    code: 200,
    client: new OSS(ossobj),
    domain: match.domain,
  };
}

// 获取已添加的客户端列表
router.post("/getProjectList", async (ctx) => {
  ctx.body = {
    list: await sql((db) => db.oss.accounts)
  };
});

// 添加客户端，目前仅支持阿里OSS
router.post("/createClient", async (ctx) => {
  const params = ctx.request.body;
  await sql((db) => {
    if (params.id) {
      // 是编辑
      const index = db.oss.accounts.findIndex((acc) => acc.id === params.id);
      if (index > -1) {
        db.oss.accounts[index] = params;
      }
    } else {
      const id = db.oss.accounts.length
        ? Number(db.oss.accounts.at(-1).id + 1)
        : 1;
      db.oss.accounts.push({
        ...params,
        id,
      });
    }
  });
  return null;
});
// 移除客户端
router.post("/removeClient", async (ctx) => {
  const { id } = ctx.request.body;
  await sql((db) => {
    let { accounts } = db.oss;
    const index = accounts.findIndex((acc) => acc.id === id);
    accounts.splice(index, 1);
  });
});

// 获取文件/目录列表
router.post("/getFileList", async (ctx) => {
  // https://help.aliyun.com/zh/developer-reference/list-objects-5?spm=a2c4g.11186623.0.i2
  const { id, config } = ctx.request.body;
  const projectRes = await findClient(id);
  if (projectRes.code !== 200) {
    return projectRes;
  }
  const { client, domain } = projectRes;
  const result = await client.listV2({
    prefix: config.prefix,
    delimiter: "/",
    "max-keys": 100,
  });
  /**
   * objects会返回目录下所有的文件和目录，根据size字段判断是不是目录
   * prefixes只会返回目录
   */
  const objects = result.objects
    .filter((obj) => obj.size > 0)
    .map((obj) => ({
      ...obj,
      name: obj.name.split("/").slice(-1)[0],
      url: obj.url.replace(/^https?:\/\/[^\/]+/, domain),
    }));
  const list = result.prefixes
    ? result.prefixes
        .map((subDir) => ({
          name: subDir.replace(/\/$/, "").split("/").slice(-1)[0],
          type: "dir",
        }))
        .concat(objects)
    : objects;
    ctx.body = {list};
});

// 删除文件
router.post("/deleteFile", async (ctx) => {
  const { id, path, paths } = ctx.request.body;
  const projectRes = await findClient(id);
  if (projectRes.code !== 200) {
    return projectRes;
  }
  const { client } = projectRes;
  if (paths) {
    await pMap(paths, (path: string) => client.delete(path), {
      concurrency: 4,
    });
    await removeHistory(paths);
  } else {
    await client.delete(path);
    await removeHistory(path);
  }
});

// 创建目录
router.post("/createDirectory", async (ctx) => {
  const { id, path: uploadPath, name } = ctx.request.body;
  const projectRes = await findClient(id);
  if (projectRes.code !== 200) {
    return projectRes;
  }
  const { client } = projectRes;
  await client.put(`${uploadPath}${name}/`, Buffer.from(""));
});
// 上传文件
router.post("/upload", async (ctx) => {
  const { id, path: uploadPath, files } = ctx.request.body;
  const projectRes = await findClient(id);
  if (projectRes.code !== 200) {
    return projectRes;
  }
  const { client, domain } = projectRes;
  await Promise.all(
    files.map((file: string) =>
      client.put(`${uploadPath}${basename(file)}`, file)
    )
  );
  addHistory(files.map((file) => `${domain}/${uploadPath}${basename(file)}`));
});

// 读取CSS代码设置
router.post("/getSetting", async (ctx) => {
  ctx.body = await sql((db) => db.oss.setting);
});
// 修改CSS代码设置
router.post("/saveSetting", async (ctx) => {
  await sql((db) => {
    db.oss.setting = ctx.request.body;
  });
});

// 获取项目前缀，快捷使用
router.post("/getShortcut", async (ctx) => {
  const { accounts } = await sql((db) => db.oss);
  ctx.body = {
    shortcut: accounts.find((acc) => acc.id === Number(ctx.request.body.id)).shortcut
  };
});

// 获取上传记录
router.post("/getHistory", async (ctx) => {
  const params = ctx.request.body;
  const history = await sql((db) => db.oss.history);
  if (!history || !history.length) {
    return {
      list: [],
      totalCount: 0,
    };
  }
  const start = (params.pageIndex - 1) * params.pageSize;
  const end = start + params.pageSize;
  const list = history.slice(start, end);
  ctx.body = {
    list,
    totalCount: history.length,
  };
});

// 添加上传记录
async function addHistory(filePaths: string[]) {
  await sql((db) => {
    const uploadLog = filePaths.map((item) => ({
      path: item,
      createTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    }));
    db.oss.history = db.oss.history
      ? db.oss.history.concat(uploadLog)
      : uploadLog;
  });
}

// 移除上传记录
async function removeHistory(filePath: string | string[]) {
  await sql((db) => {
    const { history } = db.oss;
    if (!history) {
      db.oss.history = [];
    }
    if (Array.isArray(filePath)) {
      db.oss.history = history.filter((item) => filePath.includes(item.path));
    } else {
      db.oss.history = history.filter((item) => item.path !== filePath);
    }
  });
}
