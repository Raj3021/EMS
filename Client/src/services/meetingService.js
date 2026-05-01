import api from "./api";

export const getMeetings = (params = {}) =>
  api.get("/meetings", { params }).then((r) => r.data);

export const getMeeting = (id) =>
  api.get(`/meetings/${id}`).then((r) => r.data);

export const createMeeting = (data) =>
  api.post("/meetings", data).then((r) => r.data);

export const updateMeeting = (id, data) =>
  api.put(`/meetings/${id}`, data).then((r) => r.data);

export const deleteMeeting = (id) =>
  api.delete(`/meetings/${id}`).then((r) => r.data);

export const rsvpMeeting = (id, rsvp_status) =>
  api.put(`/meetings/${id}/rsvp`, { rsvp_status }).then((r) => r.data);
