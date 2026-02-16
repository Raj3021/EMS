import api from "./api";

export const settingsService = {
  // Get current user settings
  getSettings: async () => {
    const response = await api.get("/employees/current/settings");
    return response.data;
  },

  // Update profile settings
  updateProfile: async (data) => {
    const response = await api.put("/employees/current/profile", data);
    return response.data;
  },

  // Update company settings (admin only)
  updateCompany: async (data) => {
    const response = await api.put("/employees/current/company", data);
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post("/employees/current/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};
