// /src/context/ChatContext.js

import React, { createContext, useState } from 'react';
import uuid from 'react-native-uuid';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [chats, setChats] = useState([]);

    const startNewChat = () => {
        const newChat = {
            id: uuid.v4(),
            name: `Group ${chats.length + 1}`,
            members: [
                { id: uuid.v4(), name: 'Alice' },
                { id: uuid.v4(), name: 'Bob' },
            ],
            messages: [],
            typing: false,
        };
        setChats((prev) => [newChat, ...prev]);
    };

    const sendMessage = (chatId, text) => {
        if (!text.trim()) return;

        setChats((prev) =>
            prev.map((chat) =>
                chat.id === chatId
                    ? {
                          ...chat,
                          messages: [
                              {
                                  id: uuid.v4(),
                                  text,
                                  sender: { id: 'me', name: 'You' },
                                  timestamp: new Date(),
                                  reactions: [],
                                  replies: [],
                              },
                              ...chat.messages,
                          ],
                      }
                    : chat
            )
        );

        simulateTyping(chatId);
    };

    const simulateTyping = (chatId) => {
        setChats((prev) =>
            prev.map((chat) =>
                chat.id === chatId ? { ...chat, typing: true } : chat
            )
        );

        setTimeout(() => {
            const botReply = {
                id: uuid.v4(),
                text: 'Got it!',
                sender: { id: uuid.v4(), name: 'Bot' },
                timestamp: new Date(),
                reactions: [],
                replies: [],
            };

            setChats((prev) =>
                prev.map((chat) =>
                    chat.id === chatId
                        ? {
                              ...chat,
                              messages: [botReply, ...chat.messages],
                              typing: false,
                          }
                        : chat
                )
            );
        }, 2000);
    };

    const addReply = (chatId, messageId, text) => {
        if (!text.trim()) return;

        setChats((prev) =>
            prev.map((chat) =>
                chat.id === chatId
                    ? {
                          ...chat,
                          messages: chat.messages.map((msg) =>
                              msg.id === messageId
                                  ? {
                                        ...msg,
                                        replies: [
                                            ...msg.replies,
                                            {
                                                id: uuid.v4(),
                                                text,
                                                timestamp: new Date(),
                                            },
                                        ],
                                    }
                                  : msg
                          ),
                      }
                    : chat
            )
        );
    };

    const addReaction = (chatId, messageId, emoji) => {
        setChats((prev) =>
            prev.map((chat) =>
                chat.id === chatId
                    ? {
                          ...chat,
                          messages: chat.messages.map((msg) =>
                              msg.id === messageId
                                  ? {
                                        ...msg,
                                        reactions: [
                                            ...msg.reactions,
                                            { emoji },
                                        ],
                                    }
                                  : msg
                          ),
                      }
                    : chat
            )
        );
    };

    return (
        <ChatContext.Provider
            value={{ chats, startNewChat, sendMessage, addReply, addReaction }}
        >
            {children}
        </ChatContext.Provider>
    );
};
