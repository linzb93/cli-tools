import { join, basename } from "node:path";
import http from "node:http";
import fs from "node:fs";
import open from "open";
import { Router } from "express";
import internalIp from "internal-ip";
import { execaCommand as execa } from "execa";
import { sleep } from "@linzb93/utils";
import axios from "axios";
import responseFmt from "../shared/response";
import pMap from "p-map";
import sql from "@/common/sql";
import { copy } from "@/common/helper";
import { HTTP_STATUS, tempPath } from "@/common/constant";
import { showOpenDialog, showSaveDialog } from "@/common/dialog";
import multer from "multer";
import globalConfig from "../../../../../../config.json";
import intoStream from "into-stream";
const upload = multer();

export default async (router: Router) => {
  // 复制文本
  router.post("/copy", (req, res) => {
    copy(req.body.text);
    res.send(responseFmt());
  });

  // 下载文件
  router.post("/download", (req, res) => {
    const params = req.body.url;
    showSaveDialog()
      .then((result) => {
        if (!result) {
          throw new Error("未选择保存目录");
        }
        const list = Array.isArray(params) ? params : [params];
        return pMap(
          list,
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
      })
      .then(() => {
        res.send(responseFmt());
      })
      .catch((e) => {
        res.send(
          responseFmt({
            code: HTTP_STATUS.BAD_REQUEST,
            message: e,
          })
        );
      });
  });

  // 打开网页或本地目录、VSCode项目
  const openPath = (path: string) => open(path);
  const openWeb = (path: string) => open(path);
  const openInVSCode = async (path: string) => {
    await execa(`code ${path}`);
    await sleep(200);
  };
  router.post("/open", (req, res) => {
    const { type, url } = req.body;
    let callback: (param: string) => Promise<any>;
    if (type === "path") {
      callback = openPath;
    } else if (type === "web") {
      callback = openWeb;
    } else {
      callback = openInVSCode;
    }
    new Promise((resolve) => {
      if (Array.isArray(url)) {
        pMap(url, callback, { concurrency: 4 }).then(resolve);
      } else {
        callback(url).then(resolve);
      }
    }).then(() => {
      res.send(responseFmt());
    });
  });

  // 选择文件夹路径
  router.post("/getDirectoryPath", async (_, res) => {
    showOpenDialog("directory").then((result) => {
      if (!result) {
        res.send(
          responseFmt({
            path: "",
          })
        );
        return;
      }
      res.send(
        responseFmt({
          path: result,
        })
      );
    });
  });

  router.post("/upload", upload.single("file"), (req, res) => {
    const uid = Date.now();
    const filename = join(tempPath, `${uid}.jpg`);
    intoStream(req.file.buffer)
      .pipe(fs.createWriteStream(filename))
      .on("finish", () => {
        internalIp.v4().then((ip) => {
          res.send(
            responseFmt({
              url: `http://${ip}:${globalConfig.port.production}${
                globalConfig.prefix.temp
              }/${basename(filename)}`,
            })
          );
        });
      });
  });

  // 同步菜单
  router.post("/syncMenus", (req, res) => {
    sql((db) => {
      db.menus = req.body;
    }).then(() => {
      res.send(responseFmt());
    });
  });

  // 获取跨域脚本或接口
  router.post("/fetchApiCrossOrigin", (req, res) => {
    const params = req.body;
    axios({
      method: params.method || "get",
      url: params.url,
      data: params.data || {},
    })
      .then((response) => {
        res.send(
          responseFmt({
            result: response.data,
          })
        );
      })
      .catch((error) => {
        res.send(
          responseFmt({
            message: error.message,
            result: null,
            code: HTTP_STATUS.BAD_REQUEST,
          })
        );
      });
  });
};
