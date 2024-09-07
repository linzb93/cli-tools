import { omit } from "lodash-es";
interface IResponse {
  code?: number;
  [key: string]: any;
}
export default (response?: IResponse) => {
  if (!response || !response.code || response.code === 200) {
    return {
      code: 200,
      result: omit(response, ["code"]),
    };
  }
  return response;
};
