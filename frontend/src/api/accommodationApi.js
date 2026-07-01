import axiosClient from './axiosClient';

export const getAccommodations = (params = {}) =>
  axiosClient.get('/accommodations', { params }).then((res) => res.data);

export const getAccommodation = (id) =>
  axiosClient.get(`/accommodations/${id}`).then((res) => res.data);

export const getMyAccommodations = () =>
  axiosClient.get('/accommodations/host/mine').then((res) => res.data);

// Shared by create + edit: the listing form always submits multipart data
// (new File uploads plus the list of existing image URLs the user kept),
// so both mutations funnel through the same payload -> FormData mapping.
function toFormData(payload) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'newImages') {
      (value || []).forEach((file) => formData.append('images', file));
      return;
    }
    if (key === 'existingImages') {
      formData.append('images', JSON.stringify(value || []));
      return;
    }
    if (key === 'amenities') {
      formData.append('amenities', JSON.stringify(value || []));
      return;
    }
    if (typeof value === 'boolean') {
      formData.append(key, String(value));
      return;
    }
    formData.append(key, value ?? '');
  });

  return formData;
}

export const createAccommodation = (payload) =>
  axiosClient
    .post('/accommodations', toFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);

export const updateAccommodation = (id, payload) =>
  axiosClient
    .put(`/accommodations/${id}`, toFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);

export const deleteAccommodation = (id) =>
  axiosClient.delete(`/accommodations/${id}`).then((res) => res.data);
