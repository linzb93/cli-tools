import {ref} from 'vue';

export default (url:string) => {
  const data = ref('');
  const es = new EventSource(url);
  es.onmessage = (event) => {
    data.value = event.data;
  };
  return data;
}