import { Response } from 'express';
import { HTTP_STATUS } from '@cli-tools/shared';
import { AnyObject } from '@cli-tools/shared';

export default async (res: Response, obj: AnyObject | null) => {
    res.send({
        code: HTTP_STATUS.SUCCESS,
        result: obj,
    });
};
