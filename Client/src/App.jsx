import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/layouts/DashboardLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import AcceptInvite from "./pages/AcceptInvite";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Employees from "./pages/Employees";
import Tasks from "./pages/Tasks";
import Meetings from "./pages/Meetings";
import Files from "./pages/Files";
import Chat from "./pages/Chat";
import Leaves from "./pages/Leaves";
import Notes from "./pages/Notes";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import "./index.css";
import ProtectedRoute from "./pages/ProtectedRoute";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext"; // Ensure AuthProvider is also used if not already wrapping App in main.jsx

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <Routes>
        {/* Public Routes (No Layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />

        {/* Protected Routes (With Layout) */}
        <Route element={<ProtectedRoute />}>
        <Route
          path="/"
          element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          }
        />
        <Route
          path="/analytics"
          element={
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          }
        />
        <Route
          path="/employees"
          element={
            <DashboardLayout>
              <Employees />
            </DashboardLayout>
          }
        />
        <Route
          path="/tasks"
          element={
            <DashboardLayout>
              <Tasks />
            </DashboardLayout>
          }
        />
        <Route
          path="/meetings"
          element={
            <DashboardLayout>
              <Meetings />
            </DashboardLayout>
          }
        />
        <Route
          path="/files"
          element={
            <DashboardLayout>
              <Files />
            </DashboardLayout>
          }
        />
        <Route
          path="/chat"
          element={
            <DashboardLayout>
              <Chat />
            </DashboardLayout>
          }
        />
        <Route
          path="/leaves"
          element={
            <DashboardLayout>
              <Leaves />
            </DashboardLayout>
          }
        />
        <Route
          path="/notes"
          element={
            <DashboardLayout>
              <Notes />
            </DashboardLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          }
        />

        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
