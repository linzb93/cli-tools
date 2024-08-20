import { ref, shallowRef } from 'vue'
import axios from 'axios'
import { loading } from '../util'
import globalConfig from '../../../../../config.json'
interface Option {
  showLoading?: boolean
}

const service = axios.create({
  baseURL: `http://localhost:${globalConfig.port.production}${globalConfig.prefix.api}`,
  timeout: 60000
})

export default async function doRequest(path: string, params?: any, options?: Option) {
  if (options?.showLoading) {
    loading.open()
  }
  const response = await service({
    method: 'POST',
    url: path,
    data: params
  })
  if (options?.showLoading) {
    loading.close()
  }
  const res = response.data
  if (res.code !== 200) {
    return Promise.reject(res)
  }
  return res.result
}

// hook
export function useRequest<T = any>(path: string, params?: any, options?: Option) {
  const loaded = shallowRef(false)
  const result = ref<T>()
  return {
    loaded,
    result,
    async fetch() {
      const res = await doRequest(path, params, options)
      loaded.value = true
      result.value = res
    }
  }
}
