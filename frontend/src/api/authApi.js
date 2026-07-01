import axiosClient from './axiosClient';

export const login = (email, password) =>
  axiosClient.post('/users/login', { email, password }).then((res) => res.data);

export const register = (payload) =>
  axiosClient.post('/users/register', payload).then((res) => res.data);

export const getMe = () => axiosClient.get('/users/me').then((res) => res.data);
