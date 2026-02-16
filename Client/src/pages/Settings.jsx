import { useState, useEffect } from "react";
import { Building2, User, Shield, Bell, Palette } from "lucide-react";
import { settingsService } from "@/services/settingsService";
import { useAuth } from "@/context/AuthContext";

const tabs = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("company");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  // Form states
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    designation: "",
    department: "",
  });

  const [company, setCompany] = useState({
    name: "",
    domain: "",
  });

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await settingsService.getSettings();
        setProfile(data.profile);
        setCompany(data.company);
        setError(null);
      } catch (err) {
        console.error("Error loading settings:", err);
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Handle profile form submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await settingsService.updateProfile(profile);
      setError(null);
      // Show success message (you can add a toast here)
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Handle company form submit
  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await settingsService.updateCompany(company);
      setError(null);
      alert("Company settings updated successfully!");
    } catch (err) {
      console.error("Error updating company:", err);
      setError("Failed to update company settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and company settings
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs Sidebar */}
        <div className="lg:w-64">
          <nav className="dashboard-card p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted"
                }`}>
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "company" && (
            <div className="dashboard-card animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">Company Settings</h2>
              <form className="space-y-6" onSubmit={handleCompanySubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={company.name}
                      onChange={(e) =>
                        setCompany({ ...company, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Domain
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={company.domain || ""}
                      onChange={(e) =>
                        setCompany({ ...company, domain: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="dashboard-card animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
              <form className="space-y-6" onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={profile.firstName || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={profile.lastName || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, lastName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="input-field"
                      value={profile.email || ""}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      className="input-field"
                      value={profile.phone || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Designation
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={profile.designation || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, designation: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={profile.department || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, department: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "security" && (
            <div className="dashboard-card animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors">
                      Enable
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Current Password
                      </label>
                      <input type="password" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        New Password
                      </label>
                      <input type="password" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Confirm New Password
                      </label>
                      <input type="password" className="input-field" />
                    </div>
                    <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                      Update Password
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-4">Role-Based Access</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="table-header">
                          <th className="text-left p-3 rounded-l-lg">Role</th>
                          <th className="text-left p-3">Users</th>
                          <th className="text-left p-3 rounded-r-lg">
                            Permissions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="p-3 font-medium">Admin</td>
                          <td className="p-3 text-muted-foreground">3 users</td>
                          <td className="p-3">
                            <span className="badge badge-success">
                              Full Access
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="p-3 font-medium">Manager</td>
                          <td className="p-3 text-muted-foreground">
                            12 users
                          </td>
                          <td className="p-3">
                            <span className="badge badge-primary">
                              Limited Access
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-medium">Employee</td>
                          <td className="p-3 text-muted-foreground">
                            141 users
                          </td>
                          <td className="p-3">
                            <span className="badge badge-muted">
                              Basic Access
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="dashboard-card animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">
                Notification Settings
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: "Email Notifications",
                    description:
                      "Receive email updates about your account activity",
                  },
                  {
                    title: "Push Notifications",
                    description: "Get push notifications on your devices",
                  },
                  {
                    title: "Task Reminders",
                    description: "Get reminded about upcoming task deadlines",
                  },
                  {
                    title: "Meeting Alerts",
                    description: "Receive alerts before scheduled meetings",
                  },
                  {
                    title: "Team Updates",
                    description: "Get notified about team member activities",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={index < 3}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="dashboard-card animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">
                Appearance Settings
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Theme</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <button className="p-4 rounded-xl border-2 border-primary bg-card text-center">
                      <div className="w-full aspect-video bg-background rounded-lg mb-2 border border-border"></div>
                      <span className="font-medium">Light</span>
                    </button>
                    <button className="p-4 rounded-xl border-2 border-border bg-card text-center hover:border-primary/50 transition-colors">
                      <div className="w-full aspect-video bg-foreground rounded-lg mb-2"></div>
                      <span className="font-medium">Dark</span>
                    </button>
                    <button className="p-4 rounded-xl border-2 border-border bg-card text-center hover:border-primary/50 transition-colors">
                      <div className="w-full aspect-video bg-gradient-to-r from-background to-foreground rounded-lg mb-2"></div>
                      <span className="font-medium">System</span>
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-4">Language</h3>
                  <select className="input-field max-w-xs">
                    <option>English (US)</option>
                    <option>English (UK)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}  
    </div>  
  );
}
