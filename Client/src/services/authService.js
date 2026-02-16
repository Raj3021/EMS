import api from "./api";

export const authService = {
  login: async ({email, password}) => {
    // console.log("Attempting login with:", { email, password });
    const response = await api.post("/auth/login", {
      email,
      password
    });
    if (response.data.accessToken) {
      localStorage.setItem("token", response.data.accessToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    if (userStr) return JSON.parse(userStr);
    return null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
};
