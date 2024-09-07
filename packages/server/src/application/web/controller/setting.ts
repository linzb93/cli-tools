import { Router } from "express";
import sql from "@/common/sql";
import responseFmt from "../shared/response";
const router = Router();

router.post("/get", (_, res) => {
  sql((db) => ({
    ipc: db.ipc,
    oaApiPrefix: db.oa ? db.oa.apiPrefix : "",
    user: db.sync ? db.sync.user : "",
    password: db.sync ? db.sync.password : "",
  })).then((result) => {
    res.send(responseFmt(result));
  });
});

router.post("/save", (req, res) => {
  const params = req.body;
  sql((db) => {
    db.ipc = params.ipc;
    if (db.oa) {
      db.oa.apiPrefix = params.oaApiPrefix;
    } else {
      db.oa = {
        apiPrefix: params.oaApiPrefix,
      };
    }
    db.sync = {
      user: params.user,
      password: params.password,
    };
  }).then(() => {
    res.send(responseFmt());
  });
});

export default router;
