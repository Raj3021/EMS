import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, User, Shield, Bell, Palette, Eye, EyeOff, Check, X, LogOut } from "lucide-react";
import { settingsService } from "@/services/settingsService";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";

const tabs = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "company");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const { user, logout } = useAuth();
  const { updateTheme } = useTheme();
  const toast = useToast();

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

  const [preferences, setPreferences] = useState({
    theme: "system",
    language: "en-US",
    notifications: {},
  });

  const [roleStats, setRoleStats] = useState([]);

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        setError("All password fields are required");
        return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError("New passwords do not match");
        return;
    }

    try {
      setSaving(true);
      setError(null);
      await settingsService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password updated successfully!");
    } catch (err) {
      console.error("Error updating password:", err);
      const errorMessage = err.response?.data?.message || "Failed to update password";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const [settingsData, preferencesData, roleStatsData] = await Promise.all([
          settingsService.getSettings(),
          settingsService.getPreferences(),
          settingsService.getRoleStats(),
        ]);
        
        setProfile(settingsData.profile);
        setCompany(settingsData.company);
        setPreferences(preferencesData);
        setRoleStats(roleStatsData);
        
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
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to update profile";
      setError(errorMessage);
      toast.error(errorMessage);
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
      toast.success("Company settings updated successfully!");
    } catch (err) {
      console.error("Error updating company:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to update company settings";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Handle preferences submit (Appearance & Notifications)
  const handlePreferencesSubmit = async () => {
    try {
      setSaving(true);
      await settingsService.updatePreferences(preferences);
      updateTheme(preferences.theme); // Update theme context immediately
      setError(null);
      toast.success("Preferences updated successfully!");
    } catch (err) {
      console.error("Error updating preferences:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to update preferences";
      setError(errorMessage);
      toast.error(errorMessage);
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
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchParams({ tab: tab.id });
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted"
                }`}>
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
            
            <div className="border-t border-border my-2"></div>
            
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to log out?")) {
                  logout();
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
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
                      <div className="relative">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          className="input-field pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          className="input-field pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          className="input-field pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      {passwordForm.confirmPassword && (
                        <div className={`flex items-center gap-2 mt-2 text-sm ${
                            passwordForm.newPassword === passwordForm.confirmPassword 
                            ? "text-green-600" 
                            : "text-destructive"
                        }`}>
                            {passwordForm.newPassword === passwordForm.confirmPassword ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>Passwords match</span>
                                </>
                            ) : (
                                <>
                                    <X className="w-4 h-4" />
                                    <span>Passwords do not match</span>
                                </>
                            )}
                        </div>
                      )}
                    </div>
                    <button 
                        onClick={handlePasswordSubmit}
                        disabled={saving}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {saving ? "Updating..." : "Update Password"}
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
                        {roleStats.map((role, index) => (
                          <tr key={index} className="border-b border-border">
                            <td className="p-3 font-medium">{role.role}</td>
                            <td className="p-3 text-muted-foreground">
                              {role.users}
                            </td>
                            <td className="p-3">
                              <span className={`badge badge-${role.badgeColor}`}>
                                {role.permissions}
                              </span>
                            </td>
                          </tr>
                        ))}
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
                    id: "emailNotifications",
                    title: "Email Notifications",
                    description:
                      "Receive email updates about your account activity",
                  },
                  {
                    id: "pushNotifications",
                    title: "Push Notifications",
                    description: "Get push notifications on your devices",
                  },
                  {
                    id: "taskReminders",
                    title: "Task Reminders",
                    description: "Get reminded about upcoming task deadlines",
                  },
                  {
                    id: "meetingAlerts",
                    title: "Meeting Alerts",
                    description: "Receive alerts before scheduled meetings",
                  },
                  {
                    id: "teamUpdates",
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
                        checked={preferences.notifications[item.id] !== false}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            notifications: {
                              ...preferences.notifications,
                              [item.id]: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={handlePreferencesSubmit}
                  disabled={saving}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
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
                  <div className="grid grid-cols-2 gap-4">
                    {["light", "dark"].map((theme) => (
                      <button
                        key={theme}
                        onClick={() =>
                          setPreferences({ ...preferences, theme })
                        }
                        className={`p-4 rounded-xl border-2 ${
                          preferences.theme === theme
                            ? "border-primary"
                            : "border-border"
                        } bg-card text-center hover:border-primary/50 transition-colors`}>
                        <div
                          className={`w-full aspect-video ${
                            theme === "light"
                              ? "bg-white border-gray-200"
                              : "bg-slate-950 border-slate-800"
                          } rounded-lg mb-2 border`}></div>
                        <span className="font-medium capitalize">{theme}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-4">Language</h3>
                  <select
                    value={preferences.language}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        language: e.target.value,
                      })
                    }
                    className="input-field max-w-xs">
                    <option value="en-US">English (US)</option>
                    <option value="en-UK">English (UK)</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={handlePreferencesSubmit}
                  disabled={saving}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}  
    </div>  
  );
}
