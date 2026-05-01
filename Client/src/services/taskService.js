import api from "./api";

export const taskService = {
  getTasks: async (projectId = null) => {
    const params = projectId ? { project_id: projectId } : {};
    const response = await api.get("/tasks", { params });
    return response.data;
  },

  createTask: async (data) => {
    const response = await api.post("/tasks", data);
    return response.data;
  },

  updateTask: async (id, data) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  }
};
