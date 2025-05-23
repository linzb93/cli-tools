import { Response } from 'express';
import { HTTP_STATUS } from '@/utils/constant';
import { AnyObject } from '@/typings';
export default async (res: Response, obj: AnyObject) => {
    res.send({
        code: HTTP_STATUS.SUCCESS,
        result: obj,
    });
};
