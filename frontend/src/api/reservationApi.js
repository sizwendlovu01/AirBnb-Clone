import axiosClient from './axiosClient';

export const createReservation = (payload) =>
  axiosClient.post('/reservations', payload).then((res) => res.data);

export const getMyReservations = () =>
  axiosClient.get('/reservations/user').then((res) => res.data);

export const getHostReservations = () =>
  axiosClient.get('/reservations/host').then((res) => res.data);

export const cancelReservation = (id) =>
  axiosClient.delete(`/reservations/${id}`).then((res) => res.data);
