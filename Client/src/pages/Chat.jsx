import { useState, useEffect, useRef } from "react";
import {
  Search,
  Send,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Users,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { NewChatModal } from "@/components/chat/NewChatModal";
import { useSocket } from "@/context/SocketContext";
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from "@/context/AuthContext";
import * as chatService from "@/services/chatService";
import { format, isToday, isYesterday, isThisWeek, formatDistanceToNow } from "date-fns";

export default function Chat() {
  const { socket, refreshUnreadCount } = useSocket();
  const { user: currentUser } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [showChatOptions, setShowChatOptions] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      console.log("📨 Received new_message via WebSocket:", message);
      console.log("📅 created_at value:", message.created_at);
      
      const isViewingThisConversation = selectedConversation && message.conversation_id === selectedConversation.id;
      
      console.log("🔍 Debug - isViewingThisConversation:", isViewingThisConversation);
      
      // Update messages if looking at this conversation
      if (isViewingThisConversation) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
        
        // Mark as read immediately since we're viewing this conversation
        console.log("✅ Marking conversation as read:", message.conversation_id);
        chatService.markConversationAsRead(message.conversation_id)
          .then(() => {
            console.log("✅ Mark as read successful, refreshing unread count");
            refreshUnreadCount();
            // Also update local conversation list to set unread to 0
            setConversations(prev => prev.map(c => {
              if (c.id === message.conversation_id) {
                console.log("✅ Setting unread_count to 0 for conversation:", c.id);
                return { ...c, unread_count: 0 };
              }
              return c;
            }));
          })
          .catch(err => {
            console.error("❌ Failed to mark as read:", err);
          });
      }

      // Update conversation list (move to top, update last message)
      setConversations((prev) => {
        const index = prev.findIndex(c => c.id === message.conversation_id);
        if (index === -1) {
          // New conversation (fetch it or add placeholder)
          fetchConversations();
          return prev;
        }

        const updatedConversations = [...prev];
        const conv = updatedConversations[index];
        
        // Set unread to 0 if viewing this conversation, otherwise increment
        const newUnreadCount = isViewingThisConversation ? 0 : parseInt(conv.unread_count || 0) + 1;
        
        console.log(`🔢 Setting unread_count for ${conv.id}:`, newUnreadCount, "(viewing:", isViewingThisConversation, ")");
        
        // Update details
        updatedConversations.splice(index, 1);
        updatedConversations.unshift({
          ...conv,
          updated_at: new Date().toISOString(),
          last_message: {
            content: message.content,
            created_at: message.created_at,
            sender_id: message.sender_id
          },
          unread_count: newUnreadCount
        });

        return updatedConversations;
      });
    };

    const handleUserTyping = ({ conversation_id, userId }) => {
      if (selectedConversation?.id === conversation_id) {
        setTypingUsers((prev) => ({ ...prev, [userId]: true }));
      }
    };

    const handleUserStopTyping = ({ conversation_id, userId }) => {
      if (selectedConversation?.id === conversation_id) {
        setTypingUsers((prev) => {
          const newState = { ...prev };
          delete newState[userId];
          return newState;
        });
      }
    };

    const handleConversationDeleted = ({ conversation_id }) => {
      console.log("🗑️ Conversation deleted via WebSocket:", conversation_id);
      setConversations((prev) => prev.filter(c => c.id !== conversation_id));
      if (selectedConversation?.id === conversation_id) {
        setSelectedConversation(null);
        setMessages([]);
      }
    };

    const handleChatCleared = ({ conversation_id }) => {
      console.log("🧹 Chat cleared via WebSocket:", conversation_id);
      if (selectedConversation?.id === conversation_id) {
        setMessages([]);
      }
      setConversations((prev) => prev.map(c => 
        c.id === conversation_id ? { ...c, last_message: null } : c
      ));
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);
    socket.on("conversation_deleted", handleConversationDeleted);
    socket.on("chat_cleared", handleChatCleared);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      socket.off("conversation_deleted", handleConversationDeleted);
      socket.off("chat_cleared", handleChatCleared);
    };
  }, [socket, selectedConversation]);

  const fetchConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
      if (data.length > 0 && !selectedConversation) {
        // Optionally select first conversation
        // handleSelectConversation(data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setLoadingMessages(true);
    setMessages([]); // Clear previous messages
    setTypingUsers({}); // Clear typing status

    try {
      const msgs = await chatService.getMessages(conversation.id);
      setMessages(msgs);
      
      if (socket) {
        socket.emit("join_conversation", conversation.id);
      }
      
      // Mark as read
      if (conversation.unread_count > 0) {
        await chatService.markConversationAsRead(conversation.id);
        // Update local state to clear unread
        setConversations(prev => prev.map(c => 
          c.id === conversation.id ? { ...c, unread_count: 0 } : c
        ));
        // Refresh global unread count
        refreshUnreadCount();
      }
      
      scrollToBottom();
    } catch (error) {
      console.error("Failed to load messages", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const content = messageInput;
    setMessageInput(""); // Clear input immediately

    // Emit socket event for real-time
    if (socket) {
      socket.emit("send_message", {
        conversation_id: selectedConversation.id,
        content,
        message_type: "text"
      });
      
      socket.emit("stop_typing", { conversation_id: selectedConversation.id });
    } else {
      // Fallback API call
      try {
        const newMsg = await chatService.sendMessage(selectedConversation.id, content);
        setMessages(prev => [...prev, newMsg]);
        scrollToBottom();
      } catch (error) {
        console.error("Failed to send message", error);
      }
    }
  };

  const handleTyping = (e) => {
    setMessageInput(e.target.value);

    if (socket && selectedConversation) {
      socket.emit("typing", { conversation_id: selectedConversation.id });

      // Debounce stop typing
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { conversation_id: selectedConversation.id });
      }, 2000);
    }
  };

  const onEmojiClick = (emojiData) => {
    setMessageInput((prev) => prev + emojiData.emoji);
    setIsEmojiPickerOpen(false);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedConversation) return;

    try {
      // Set loading state for message?
      
      const { url, mimetype } = await chatService.uploadFile(file);
      const isImage = mimetype.startsWith("image/");
      const messageType = isImage ? "image" : "file";
      
      // Send message with file URL
      if (socket) {
        socket.emit("send_message", {
          conversation_id: selectedConversation.id,
          content: url, // For now, content is the URL
          message_type: messageType
        });
      }
    } catch (error) {
      console.error("File upload failed", error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleChatCreated = (newChat) => {
    setConversations((prev) => [newChat, ...prev]);
    handleSelectConversation(newChat);
  };

  const handleClearChat = async () => {
    if (!selectedConversation) return;
    
    if (window.confirm("Are you sure you want to clear all messages in this chat?")) {
      try {
        await chatService.clearChat(selectedConversation.id);
        
        // Update messages state
        setMessages([]);
        
        // Update conversation list - clear last message
        setConversations(prev => prev.map(c => 
          c.id === selectedConversation.id 
            ? { ...c, last_message: null } 
            : c
        ));
        
        setShowChatOptions(false);
        console.log("Clear chat successful for conversation:", selectedConversation.id);
      } catch (error) {
        console.error("Failed to clear chat:", error);
      }
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedConversation) return;
    
    if (window.confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) {
      try {
        await chatService.deleteConversation(selectedConversation.id);
        
        // Update conversation list
        setConversations(prev => prev.filter(c => c.id !== selectedConversation.id));
        
        // Clear selection
        setSelectedConversation(null);
        setMessages([]);
        
        setShowChatOptions(false);
        console.log("Delete conversation successful:", selectedConversation.id);
      } catch (error) {
        console.error("Failed to delete chat:", error);
      }
    }
  };

  const getConversationName = (conv) => {
    if (conv.name) return conv.name;
    if (conv.participants) {
      const otherParticipants = conv.participants.filter(p => p.user_id !== currentUser.id);
      return otherParticipants.map(p => `${p.first_name} ${p.last_name}`).join(", ");
    }
    return "Unknown Chat";
  };

  const getConversationAvatar = (conv) => {
     if (conv.is_group) return <Users className="w-4 h-4" />;
     const name = getConversationName(conv);
     return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const getOtherParticipantStatus = (conv) => {
    if (!conv || conv.is_group) return null;
    const otherPart = conv.participants?.find(p => p.user_id !== currentUser.id);
    return otherPart ? otherPart.status : null; // status isn't real-time in this object yet unless we update it
  };

  // Helper function to format date labels (WhatsApp style)
  const getDateLabel = (date) => {
    const messageDate = new Date(date);
    
    if (isToday(messageDate)) {
      return "Today";
    } else if (isYesterday(messageDate)) {
      return "Yesterday";
    } else if (isThisWeek(messageDate, { weekStartsOn: 1 })) {
      // Return day name (e.g., "Monday", "Tuesday")
      return format(messageDate, 'EEEE');
    } else {
      // Return formatted date (e.g., "17/02/2026")
      return format(messageDate, 'dd/MM/yyyy');
    }
  };

  const filteredConversations = conversations.filter(c => 
    getConversationName(c).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-7rem)]">
      <div className="dashboard-card h-full p-0 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-border flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-border flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
            <button 
              onClick={() => setIsNewChatOpen(true)}
              className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              title="New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading chats...</div>
            ) : filteredConversations.length === 0 ? (
               <div className="p-4 text-center text-muted-foreground">No conversations found</div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border ${
                    selectedConversation?.id === conv.id ? "bg-muted/50" : ""
                  }`}>
                  <div className="relative">
                    <div className="avatar">
                      {getConversationAvatar(conv)}
                    </div>
                    {/* Status dot (simplified for now) */}
                    {/* <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card bg-muted-foreground`} /> */}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{getConversationName(conv)}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {conv.last_message?.created_at ? format(new Date(conv.last_message.created_at), 'HH:mm') : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.last_message?.content || "No messages yet"}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="min-w-[20px] h-5 flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full px-1.5 ml-2">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-background/50">
          {!selectedConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Users className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a conversation to start chatting</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                  <div className="avatar">
                    {getConversationAvatar(selectedConversation)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{getConversationName(selectedConversation)}</h3>
                    {/* Show typing status or presence */}
                    {Object.keys(typingUsers).length > 0 ? (
                       <p className="text-sm text-primary animate-pulse">Typing...</p>
                    ) : (
                       <p className="text-sm text-muted-foreground capitalize">
                        {selectedConversation.is_group ? `${selectedConversation.participants.length} members` : 'Active'}
                       </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 relative">
                  {/* Options Menu */}
                  <button 
                    onClick={() => setShowChatOptions(!showChatOptions)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-muted-foreground" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showChatOptions && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowChatOptions(false)}
                      />
                      <div className="absolute right-0 top-12 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[180px]">
                        <button
                          onClick={handleClearChat}
                          className="w-full px-4 py-2 text-left hover:bg-muted transition-colors flex items-center gap-2 text-sm"
                        >
                          <X className="w-4 h-4" />
                          Clear Chat
                        </button>
                        <button
                          onClick={handleDeleteChat}
                          className="w-full px-4 py-2 text-left hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Chat
                        </button>
                      </div>
                    </>
                  )}
                  
                  {/* Close Button */}
                  <button 
                    onClick={() => setSelectedConversation(null)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Close chat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin relative" id="messages-container">
                {loadingMessages ? (
                  <div className="text-center p-4">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground opacity-50">
                    No messages here yet. Say hello!
                  </div>
                ) : (
                  messages.map((message, index) => {
                     const isSent = message.sender_id === currentUser.currentUser?.id || message.sender_id === currentUser.id;
                     
                     // Debug: Log message structure
                     if (!message.created_at) {
                       console.log("Message missing created_at:", message);
                     }
                     
                     // Check if we need to show a date separator
                     const showDateSeparator = index === 0 || 
                       format(new Date(message.created_at), 'yyyy-MM-dd') !== 
                       format(new Date(messages[index - 1].created_at), 'yyyy-MM-dd');
                     
                     return (
                      <div key={message.id}>
                        {/* Date separator */}
                        {showDateSeparator && message.created_at && (
                          <div 
                            className="flex justify-center my-4"
                            data-date-separator
                            data-date={getDateLabel(message.created_at)}
                          >
                            <div className="bg-muted/50 text-muted-foreground text-xs px-3 py-1 rounded-full">
                              {getDateLabel(message.created_at)}
                            </div>
                          </div>
                        )}
                        
                        {/* Message bubble */}
                        <div className={`flex ${isSent ? "justify-end" : "justify-start"} mb-2`}>
                          <div
                            className={`chat-bubble max-w-[70%] ${
                              isSent ? "chat-bubble-sent" : "chat-bubble-received"
                            }`}>
                            {!isSent && selectedConversation?.is_group && message.sender_first_name && (
                              <p className="text-xs font-bold mb-1 opacity-70">
                                {message.sender_first_name}
                              </p>
                            )}
                            {message.message_type === 'image' ? (
                              <img 
                                src={message.content.startsWith('http') ? message.content : `http://localhost:5000${message.content}`} 
                                alt="Attachment" 
                                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity" 
                                onClick={() => window.open(message.content.startsWith('http') ? message.content : `http://localhost:5000${message.content}`, '_blank')} 
                              />
                            ) : message.message_type === 'file' ? (
                              <a 
                                href={message.content.startsWith('http') ? message.content : `http://localhost:5000${message.content}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-2 text-primary underline break-all"
                              >
                                <Paperclip className="w-4 h-4" />
                                {message.content.split('/').pop()}
                              </a>
                            ) : (
                              <p>{message.content}</p>
                            )}
                            <p
                              className={`text-[10px] mt-1 text-right ${
                                isSent
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground/70"
                              }`}>
                              {message.created_at ? format(new Date(message.created_at), 'HH:mm') : format(new Date(), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex items-center gap-3 relative">
                  {isEmojiPickerOpen && (
                    <div className="absolute bottom-full left-0 mb-4 z-50">
                      <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
                      {/* Click overlay to close could be added here */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsEmojiPickerOpen(false)}
                      />
                    </div>
                  )}

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileSelect}
                  />

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Paperclip className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <button 
                    onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                    className={`p-2 rounded-lg hover:bg-muted transition-colors ${isEmojiPickerOpen ? 'bg-muted' : ''}`}
                  >
                    <Smile className={`w-5 h-5 ${isEmojiPickerOpen ? 'text-primary' : 'text-muted-foreground'}`} />
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="input-field flex-1"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleSendMessage();
                    }}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <NewChatModal 
        isOpen={isNewChatOpen} 
        onClose={() => setIsNewChatOpen(false)} 
        onChatCreated={handleChatCreated}
      />
    </div>
  );
}
