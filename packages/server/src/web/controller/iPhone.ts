import fs from "node:fs";
import { join } from "node:path";
import express from "express";
import { notify, copy, readCopy } from "@/provider/helper";
import { Observable, debounceTime } from "rxjs";
import multer from "multer";
import intoStream from "into-stream";
import { tempPath } from "@/provider/constant";
import config from "../../../../../config.json";

const { Router } = express;
const router = Router();
const upload = multer();

// iPhone发往电脑
router.post("/send-copy-data", (req, res) => {
  const { text } = req.body;
  notify(text);
  copy(decodeURIComponent(text));
  res.send("ok");
});

// iPhone从电脑获取
router.get("/get-copy-data", (_, res) => {
  const copyData = readCopy();
  res.send(encodeURIComponent(copyData));
});

// iPhone批量获取电脑图片地址
// router.get("/get-img-list", async (_, res) => {
//   const list = (await mainPost({
//     method: "iPhone-get-img",
//     data: {},
//   })) as string[];
//   res.send({
//     list,
//   });
// });

// iPhone下载电脑图片
router.get("/get-img", (req, res) => {
  const imgPath = req.query.path as string;
  fs.createReadStream(imgPath).pipe(res);
});

const obs$ = new Observable((observer) => {
  // iPhone给电脑发送图片
  router.post("/send-img", upload.single("file"), async (req, res) => {
    const uid = Date.now();
    const filename = join(tempPath, `${uid}.jpg`);
    intoStream(req.file.buffer)
      .pipe(fs.createWriteStream(filename))
      .on("finish", () => {
        observer.next(
          `http://localhost:${config.port.production}${config.static}/${uid}.jpg`
        );
        res.send("ok");
      });
  });
  // iPhone给电脑批量发送图片
  router.post("/send-img-batch", (req, res) => {
    const uid = Date.now();
    const filename = join(tempPath, `${uid}.jpg`);
    req.pipe(fs.createWriteStream(filename)).on("finish", () => {
      observer.next(
        `http://localhost:${config.port.production}${config.static}/${uid}.jpg`
      );
      res.send("ok");
    });
  });
});
// obs$.subscribe({
//   next: (url) => {
//     mainPost({
//       method: "iPhone-upload-img",
//       data: url,
//       listener: false,
//     });
//   },
// });
obs$.pipe(debounceTime(3000)).subscribe(() => {
  notify(`收到来自iPhone的图片`);
});
