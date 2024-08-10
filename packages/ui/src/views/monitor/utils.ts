import axios from "axios";
import { loading } from "@/helpers/util";
import { useGlobalStore } from "@/store";
const store = useGlobalStore();

export const service = axios.create({
  baseURL: `${(store.setting as any).oaApiPrefix}/dataanaly`,
});
service.interceptors.request.use((config) => {
  loading.open();
  return config;
});
service.interceptors.response.use(
  (response) => {
    loading.close();
    return response.data.result;
  },
  (e) => {
    loading.close();
    return Promise.reject(e);
  }
);
