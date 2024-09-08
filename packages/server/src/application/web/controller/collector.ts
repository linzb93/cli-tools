import { Router } from "express";
import sql from "@/common/sql";
import { last } from "lodash-es";
import responseFmt from "../shared/response";
import { HTTP_STATUS } from "@/common/constant";
const router = Router({});
export default router;

// 获取显示功能
router.post("/getVisible", (_, res) => {
  sql((db) => db.collectors.filter((item) => item.visible)).then((list) => {
    res.send(responseFmt({ list }));
  });
});
// 获取所有功能
router.post("/getAll", (_, res) => {
  sql((db) => db.collectors).then((list) => {
    res.send(
      responseFmt({
        list: list || [],
      })
    );
  });
});

// 添加、编辑功能
router.post("/edit", (req, res) => {
  const { body } = req;
  sql((db) => {
    const { collectors } = db;
    if (body.id) {
      const match = collectors.find((item) => item.id === body.id);
      if (!match) {
        throw new Error("不存在的id");
      }
      Object.assign(match, {
        name: body.name,
        url: body.url,
      });
    } else {
      collectors.push({
        id: last(collectors).id + 1,
        name: body.name,
        url: body.url,
        visible: true,
      });
    }
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
