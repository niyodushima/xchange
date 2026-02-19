import React, { useState } from "react";
import "./ChatPanel.css";

export default function ChatPanel({ messages, sendMessage, username }) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage(text);
    setInput("");
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="chat">
      {/* Header */}
      <div className="chat-header">
        <img src="/xchange (1).png" alt="Logo" className="chat-logo" />
        <span className="chat-title">Chat</span>
      </div>

      {/* Stream */}
      <div className="chat-stream">
        <div className="chat-watermark">
          <img src="/xchange (1).png" alt="Watermark" />
        </div>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-msg ${msg.user === username ? "me" : "other"}`}
          >
            <span className="chat-user">
              {msg.user === username ? "Me" : msg.user}
            </span>
            <span className="chat-text">{msg.text}</span>
            <span className="chat-time">{formatTime(msg.timestamp)}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="chat-input">
        <textarea
          rows={1}
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
        />
        <button className="primary" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
}
