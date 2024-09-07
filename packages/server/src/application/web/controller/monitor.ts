import { Router } from "express";
import sql from "@/common/sql";
import responseFmt from "../shared/response";
const router = Router({});
export default router;
// 获取项目列表
router.post("/getApps", (_, res) => {
  sql((db) => db.monitor).then((list) => {
    res.send(
      responseFmt({
        list: list || [],
      })
    );
  });
});

// 保存已选的项目列表
router.post("/saveApps", (req, res) => {
  sql((db) => {
    db.monitor = req.body;
  }).then(() => {
    res.send(responseFmt());
  });
});
