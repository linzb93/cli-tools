import axios from 'axios';

interface IOptions {
  baseURL: string
}

export default (options: IOptions) => {
  const service = axios.create({
    baseURL: options.baseURL
  });
  return service;
}