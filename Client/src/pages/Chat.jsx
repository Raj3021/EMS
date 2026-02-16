import { useState } from "react";
import {
  Search,
  Send,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Users,
} from "lucide-react";
import { chatUsers, messages } from "@/data/mockData";

export default function Chat() {
  const [selectedUser, setSelectedUser] = useState(chatUsers[0]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = chatUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-[calc(100vh-7rem)]">
      <div className="dashboard-card h-full p-0 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-border flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border ${
                  selectedUser.id === user.id ? "bg-muted/50" : ""
                }`}>
                <div className="relative">
                  <div className="avatar">
                    {user.isGroup ? (
                      <Users className="w-4 h-4" />
                    ) : (
                      user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    )}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                      user.status === "online"
                        ? "bg-success"
                        : user.status === "away"
                          ? "bg-warning"
                          : "bg-muted-foreground"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{user.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {user.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-muted-foreground truncate">
                      {user.lastMessage}
                    </p>
                    {user.unread > 0 && (
                      <span className="min-w-[20px] h-5 flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full px-1.5">
                        {user.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="avatar">
                {selectedUser.isGroup ? (
                  <Users className="w-4 h-4" />
                ) : (
                  selectedUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                )}
              </div>
              <div>
                <h3 className="font-semibold">{selectedUser.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {selectedUser.status}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Phone className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Video className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <MoreVertical className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}>
                <div
                  className={`chat-bubble ${
                    message.isSent ? "chat-bubble-sent" : "chat-bubble-received"
                  }`}>
                  <p>{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.isSent
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}>
                    {message.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Paperclip className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Smile className="w-5 h-5 text-muted-foreground" />
              </button>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="input-field flex-1"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && messageInput.trim()) {
                    setMessageInput("");
                  }
                }}
              />
              <button className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
