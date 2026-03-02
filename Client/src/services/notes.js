import axios from "axios";

const API_URL = "http://localhost:5000/notes";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const getNotes = async (search = "") => {
  const response = await axios.get(`${API_URL}?search=${search}`, getAuthHeader());
  return response.data;
};

export const createNote = async (noteData) => {
  const response = await axios.post(API_URL, noteData, getAuthHeader());
  return response.data;
};

export const updateNote = async (id, noteData) => {
  const response = await axios.put(`${API_URL}/${id}`, noteData, getAuthHeader());
  return response.data;
};

export const deleteNote = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader());
  return response.data;
};
