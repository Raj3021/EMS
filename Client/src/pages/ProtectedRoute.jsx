import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { SocketProvider } from "../context/SocketContext"

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" replace />

  return (
    <SocketProvider>
      <Outlet />
    </SocketProvider>
  )
}
