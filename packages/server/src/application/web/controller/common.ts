import { join, basename } from "node:path";
import http from "node:http";
import fs from "node:fs";
import open from "open";
import Router from "koa-router";
import { execaCommand as execa } from "execa";
import { sleep } from "@linzb93/utils";
import axios from "axios";
import pMap from "p-map";
import sql from "@/common/sql";
import { copy } from "@/common/helper";
import { showOpenDialog, showSaveDialog } from "@/common/dialog";

export default async (router: Router) => {
  // 复制文本
  router.post("/copy", async (ctx) => {
    copy(ctx.request.body.text);
  });

  // 下载文件
  router.post("/download", async (ctx) => {
    const params = ctx.request.body.url;
    if (Array.isArray(params)) {
      // 下载多份文件
      const result = await showSaveDialog();
      if (!result) {
        ctx.body = {};
        return;
      }
      await pMap(
        params,
        (url: string) =>
          new Promise((resolve) => {
            http.get(url, (resp) => {
              if (resp.statusCode === 200) {
                resp
                  .pipe(fs.createWriteStream(join(result, basename(url))))
                  .on("finish", resolve);
              }
            });
          }),
        { concurrency: 4 }
      );
    }
    const url = params as string;
    const result = await showSaveDialog();
    if (!result) {
      ctx.body = {};
      return;
    }
    await new Promise((resolve) => {
      http.get(url, (resp) => {
        if (resp.statusCode === 200) {
          resp.pipe(fs.createWriteStream(result)).on("finish", resolve);
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
    const result = await showOpenDialog("directory");
    if (!result) {
      ctx.body = {
        path: "",
      };
      return;
    }
    ctx.body = {
      path: result,
    };
  });

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
      };
    } catch (error) {
      ctx.body = {
        success: false,
        message: error.message,
      };
    }
  });
};
