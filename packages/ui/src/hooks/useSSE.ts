import { ref, shallowRef } from 'vue'

export default (url: string) => {
  const data = ref(0)
  const result = ref('')
  const loaded = shallowRef(false)
  const fetchData = () =>
    new Promise((resolve) => {
      const es = new EventSource(url)
      es.onmessage = (event) => {
        const msg = JSON.parse(event.data)
        if (msg.last) {
          result.value = msg.data
          loaded.value = true
          es.close()
          resolve(null)
        } else {
          data.value = msg.data
        }
      }
      es.onerror = () => {
        es.close()
      }
    })
  return { data, result, loaded, fetchData }
}
