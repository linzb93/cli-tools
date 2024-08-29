import fs from "node:fs";
import { join } from "node:path";
import Router from "koa-router";
import { notify, copy, readCopy } from "@/common/helper";
import { Observable, debounceTime } from "rxjs";
import multer from "@koa/multer";
import intoStream from "into-stream";
import { tempPath } from "@/common/constant";
import config from "../../../../../../config.json";

const router = new Router({
  prefix: "/iPhone",
});
const upload = multer();
export default router;

// iPhone发往电脑
router.post("/sendCopyData", (ctx) => {
  const { text } = ctx.request.body;
  const decodedText = decodeURIComponent(text);
  notify(decodedText);
  copy(decodedText);
});

// iPhone从电脑获取
router.get("/getCopyData", (ctx) => {
  const copyData = readCopy();
  ctx.body = {
    text: encodeURIComponent(copyData),
  };
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

// // iPhone下载电脑图片
// router.get("/get-img", (ctx) => {
//   const imgPath = ctx.request.query.path as string;
//   fs.createReadStream(imgPath).pipe(ctx.res);
// });

// const obs$ = new Observable((observer) => {
//   // iPhone给电脑发送图片
//   router.post("/send-img", upload.single("file"), async (req, res) => {
//     const uid = Date.now();
//     const filename = join(tempPath, `${uid}.jpg`);
//     intoStream(req.file.buffer)
//       .pipe(fs.createWriteStream(filename))
//       .on("finish", () => {
//         observer.next(
//           `http://localhost:${config.port.production}${config.static}/${uid}.jpg`
//         );
//         res.send("ok");
//       });
//   });
//   // iPhone给电脑批量发送图片
//   router.post("/send-img-batch", (req, res) => {
//     const uid = Date.now();
//     const filename = join(tempPath, `${uid}.jpg`);
//     req.pipe(fs.createWriteStream(filename)).on("finish", () => {
//       observer.next(
//         `http://localhost:${config.port.production}${config.static}/${uid}.jpg`
//       );
//       res.send("ok");
//     });
//   });
// });
// obs$.subscribe({
//   next: (url) => {
//     mainPost({
//       method: "iPhone-upload-img",
//       data: url,
//       listener: false,
//     });
//   },
// });
// obs$.pipe(debounceTime(3000)).subscribe(() => {
//   notify(`收到来自iPhone的图片`);
// });