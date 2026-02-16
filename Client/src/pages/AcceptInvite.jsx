import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/services/api";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get("token"), [searchParams]);

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
    phone: "",
    designation: "",
    department: "",
    joiningDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Invite token is missing.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/accept-invite", {
        token,
        password: form.password,
        confirmPassword: form.confirmPassword,
        phone: form.phone,
        designation: form.designation,
        department: form.department,
        joiningDate: form.joiningDate,
      });

      setSuccess("Password set successfully. You can now log in.");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to accept invite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Set up your account</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Create a password and complete your profile to access the dashboard.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                className="input-field"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                className="input-field"
                value={form.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                className="input-field"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+1 555 123 4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Designation
              </label>
              <input
                type="text"
                className="input-field"
                value={form.designation}
                onChange={(e) => handleChange("designation", e.target.value)}
                placeholder="Project Manager"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Department
              </label>
              <input
                type="text"
                className="input-field"
                value={form.department}
                onChange={(e) => handleChange("department", e.target.value)}
                placeholder="Engineering"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Joining Date
              </label>
              <input
                type="date"
                className="input-field"
                value={form.joiningDate}
                onChange={(e) => handleChange("joiningDate", e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-success">{success}</p>}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
              Back to Login
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
              {loading ? "Saving..." : "Set Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
