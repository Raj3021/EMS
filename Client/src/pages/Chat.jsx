import { useState } from "react";
import { Send, Search, MoreVertical, Paperclip, Smile } from "lucide-react";

const contacts = [
  {
    id: 1,
    name: "John Doe",
    lastMessage: "Hey, how's the project going?",
    time: "2m ago",
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: "Jane Smith",
    lastMessage: "Can we schedule a meeting?",
    time: "1h ago",
    unread: 0,
    online: true,
  },
  {
    id: 3,
    name: "Mike Johnson",
    lastMessage: "Thanks for the update!",
    time: "3h ago",
    unread: 1,
    online: false,
  },
  {
    id: 4,
    name: "Sarah Williams",
    lastMessage: "See you tomorrow",
    time: "5h ago",
    unread: 0,
    online: false,
  },
];

const messages = [
  {
    id: 1,
    sender: "John Doe",
    content: "Hey! How are you?",
    time: "10:30 AM",
    own: false,
  },
  {
    id: 2,
    sender: "You",
    content: "I'm good! Working on the new feature",
    time: "10:32 AM",
    own: true,
  },
  {
    id: 3,
    sender: "John Doe",
    content: "Great! Let me know if you need any help",
    time: "10:33 AM",
    own: false,
  },
  {
    id: 4,
    sender: "You",
    content: "Will do, thanks!",
    time: "10:35 AM",
    own: true,
  },
];

export default function Chat() {
  const [selectedContact, setSelectedContact] = useState(contacts[0]);
  const [message, setMessage] = useState("");

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="bg-card border border-border rounded-lg overflow-hidden h-[calc(100vh-8rem)]">
        <div className="grid grid-cols-12 h-full">
          {/* Contacts Sidebar */}
          <div className="col-span-4 border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold mb-3">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-accent transition-colors ${
                    selectedContact.id === contact.id ? "bg-accent" : ""
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {contact.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      {contact.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium truncate">{contact.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          {contact.time}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {contact.lastMessage}
                      </p>
                    </div>
                    {contact.unread > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="col-span-8 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {selectedContact.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedContact.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedContact.online ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
              <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.own ? "justify-end" : "justify-start"
                  }`}>
                  <div
                    className={`max-w-[70%] ${
                      msg.own
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    } rounded-lg px-4 py-2`}>
                    <p className="text-sm">{msg.content}</p>
                    <span
                      className={`text-xs ${
                        msg.own
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      } mt-1 block`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                  <Paperclip className="w-5 h-5 text-muted-foreground" />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                  <Smile className="w-5 h-5 text-muted-foreground" />
                </button>
                <button className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
