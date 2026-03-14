import React, { createContext, useContext, useState } from "react";

const ChatOpenContext = createContext({ chatOpen: false, setChatOpen: () => {} });

export function ChatOpenProvider({ children }) {
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <ChatOpenContext.Provider value={{ chatOpen, setChatOpen }}>
      {children}
    </ChatOpenContext.Provider>
  );
}

export function useChatOpen() {
  return useContext(ChatOpenContext);
}
