import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial unread count
  const refreshUnreadCount = async () => {
    try {
      const { getUnreadCount } = await import("../services/chatService");
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to refresh unread count", error);
    }
  };

  useEffect(() => {
    // Get auth token from localStorage
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.log("No auth token found, skipping socket connection");
      return;
    }

    // Initialize Socket.IO connection
    const socketInstance = io("http://localhost:5000", {
      auth: {
        token,
      },
      autoConnect: true,
    });

    // Connection event handlers
    socketInstance.on("connect", () => {
      console.log("✅ Socket.IO connected:", socketInstance.id);
      setIsConnected(true);
      refreshUnreadCount(); // Fetch count on connect
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Socket.IO disconnected:", reason);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error.message);
      setIsConnected(false);
    });

    // Listen for new messages globally content
    socketInstance.on("new_message", (message) => {
      try {
        const decoded = jwtDecode(token);
        const userId = decoded.userId;
        
        if (message.sender_id !== userId) {
          setUnreadCount(prev => prev + 1);
          // Play notification sound?
          const audio = new Audio("/notification.mp3"); // Optional
          audio.play().catch(e => console.log("Audio play error", e)); 
        }
      } catch (error) {
        console.error("Error decoding token in socket event:", error);
      }
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []); // Empty dependency array - only run once on mount

  const value = {
    socket,
    isConnected,
    unreadCount,
    refreshUnreadCount,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
