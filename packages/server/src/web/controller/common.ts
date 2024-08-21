import { join, basename } from "node:path";
import http from "node:http";
import fs from "node:fs";
import open from "open";
// import fsp from "node:fs/promises";
import Router from "koa-router";
// import { shell, clipboard, dialog } from "electron";
import { execaCommand as execa } from "execa";
import { sleep } from "@linzb93/utils";
// import { createClient } from "webdav";
import axios from "axios";
import pMap from "p-map";
// import { cacheRoot } from "@/provider/constant";
import sql from "@/provider/sql";
import { copy, showOpenDialog } from "@/provider/helper";

export default async (router: Router) => {
  // const account = await sql((db) => db.sync);
  // const syncClient = createClient("", account);

  // 复制文本
  router.post("/copy", async (ctx) => {
    copy(ctx.body);
  });

  // 下载文件
  router.post("/download", async (ctx) => {
    const params = ctx.request.body;
    if (Array.isArray(params)) {
      // 下载多份文件
      const result = await showOpenDialog({
        properties: ["openDirectory"],
      });
      if (result.canceled) {
        return {};
      }
      await pMap(
        params,
        (url: string) =>
          new Promise((resolve) => {
            http.get(url, (resp) => {
              if (resp.statusCode === 200) {
                resp
                  .pipe(
                    fs.createWriteStream(join(result.path[0], basename(url)))
                  )
                  .on("finish", resolve);
              }
            });
          }),
        { concurrency: 4 }
      );
    }
    const url = params as string;
    const result = await showOpenDialog();
    if (result.canceled) {
      return {};
    }
    await new Promise((resolve) => {
      http.get(url, (resp) => {
        if (resp.statusCode === 200) {
          resp.pipe(fs.createWriteStream(result.path)).on("finish", resolve);
        }
      });
    });
  });

  // 打开网页或本地目录、VSCode项目
  const openPath = (path: string) => open(path);
  const openWeb = (path: string) => open(path);
  const openInVSCode = async (path: string) => {
    await execa(`code ${path}`);
    await sleep(200);
  };
  router.post("/open", async (ctx) => {
    const { type, url } = ctx.request.body;
    let callback: (param: string) => Promise<any>;
    if (type === "path") {
      callback = openPath;
    } else if (type === "web") {
      callback = openWeb;
    } else {
      callback = openInVSCode;
    }
    if (Array.isArray(url)) {
      await pMap(url, callback, { concurrency: 4 });
    } else {
      await callback(url);
    }
  });

  // 选择文件夹路径
  router.post("/getDirectoryPath", async (ctx) => {
    const { request: { body: { multiSelections } } } = ctx;
    const result = await showOpenDialog({
      properties: multiSelections
        ? ["openDirectory", "multiSelections"]
        : ["openDirectory"],
    });
    if (result.canceled) {
      return {
        path: "",
      };
    }
    if (multiSelections) {
      return {
        paths: result.path,
      };
    }
    return {
      path: result.path[0],
    };
  });

  // 同步
  //   app.handle("sync", async () => {
  //     fs.createReadStream(join(root, "sync.json")).pipe(
  //       syncClient.createWriteStream("electron-lin-tools/sync.json")
  //     );
  //     return {
  //       success: true,
  //     };
  //   });

  // 同步菜单
  router.post("/syncMenus", async (ctx) => {
    await sql((db) => {
      db.menus = ctx.request.body;
    });
  });

  // 获取跨域脚本或接口
  router.post("/fetchApiCrossOrigin", async (ctx) => {
    const params = ctx.request.body;
    try {
      const response = await axios({
        method: params.method || "get",
        url: params.url,
        data: params.data || {},
      });
      ctx.body = {
        success: true,
        result: response.data,
      }
    } catch (error) {
      ctx.body = {
        success: false,
        message: error.message,
      };
    }
  });
};
