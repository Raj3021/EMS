import api from "./api";

export const subscriptionService = {
  getPlans: () => api.get("/subscription/plans").then((r) => r.data),

  getCurrentSubscription: () =>
    api.get("/subscription/current").then((r) => r.data),

  getUsage: () => api.get("/subscription/usage").then((r) => r.data),

  createOrder: (planName, billingCycle) =>
    api
      .post("/subscription/create-order", { planName, billingCycle })
      .then((r) => r.data),

  verifyPayment: (data) =>
    api.post("/subscription/verify-payment", data).then((r) => r.data),

  getHistory: () => api.get("/subscription/history").then((r) => r.data),
};
