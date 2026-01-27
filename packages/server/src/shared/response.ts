import { Response } from 'express';
import { HTTP_STATUS } from '@cli-tools/shared/src/utils/constant';
import { AnyObject } from '@cli-tools/shared/src/types';

export default async (res: Response, obj: AnyObject) => {
    res.send({
        code: HTTP_STATUS.SUCCESS,
        result: obj,
    });
};
