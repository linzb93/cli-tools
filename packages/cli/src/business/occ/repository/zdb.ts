import { service } from '@/utils/http/company-service';
// import { getPrefix } from '../helpers/http';
import { readSecret } from '@cli-tools/shared';

export const getUserList = async () => {
    const { zdb } = await readSecret((db) => db.oa);
    return service.post(`${zdb.baseUrl}/admin/user/list`, {
        pageIndex: 1,
        pageSize: 1,
        keyword: zdb.keyword,
    });
};

export const directLogin = async (unionId: string) => {
    const { zdb } = await readSecret((db) => db.oa);
    return service.post(`${zdb.baseUrl}/login/directLogin`, {
        unionId,
    });
};
