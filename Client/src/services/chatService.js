import api from "./api";

/**
 * Fetch all conversations for the current user
 */
export const getConversations = async () => {
  try {
    const response = await api.get("/chat/conversations");
    return response.data;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    throw error;
  }
};

/**
 * Fetch a single conversation by ID
 */
export const getConversation = async (conversationId) => {
  try {
    const response = await api.get(`/chat/conversations/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw error;
  }
};

/**
 * Create a new conversation
 * @param {Array} participantIds - Array of user IDs
 * @param {Boolean} isGroup - Whether this is a group chat
 * @param {String} name - Optional name for group chat
 */
export const createConversation = async (participantIds, isGroup = false, name = null) => {
  try {
    const response = await api.post("/chat/conversations", {
      participant_ids: participantIds,
      is_group: isGroup,
      name,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

/**
 * Fetch messages for a conversation
 * @param {String} conversationId
 * @param {Number} limit - Number of messages to fetch (default 50)
 * @param {Number} offset - Offset for pagination (default 0)
 */
export const getMessages = async (conversationId, limit = 50, offset = 0) => {
  try {
    const response = await api.get(`/chat/messages/${conversationId}`, {
      params: { limit, offset },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

/**
 * Fetch total number of unread messages across all conversations
 */
export const getUnreadCount = async () => {
  try {
    const response = await api.get("/chat/unread-count");
    return response.data.count;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return 0; // Return 0 on error to not break UI
  }
};

/**
 * Send a message via REST API
 * @param {String} conversationId
 * @param {String} content
 * @param {String} messageType - Default 'text'
 */
export const sendMessage = async (conversationId, content, messageType = "text") => {
  try {
    const response = await api.post("/chat/messages", {
      conversation_id: conversationId,
      content,
      message_type: messageType,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

/**
 * Upload a file
 * @param {File} file
 * @returns {Promise<{url: string, filename: string, mimetype: string}>}
 */
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/**
 * Mark all messages in a conversation as read
 * @param {String} conversationId
 */
export const markConversationAsRead = async (conversationId) => {
  try {
    const response = await api.put(`/chat/messages/${conversationId}/read`);
    return response.data;
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    throw error;
  }
};
