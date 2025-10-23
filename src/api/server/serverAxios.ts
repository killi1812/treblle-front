import axios from 'axios';

const HOST_URL = "/api";
const serverApi = axios.create({
  baseURL: HOST_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default serverApi
