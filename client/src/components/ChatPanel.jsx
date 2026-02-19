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

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className="chat-message">
            <span className="chat-user">
              {msg.user === username ? "Me" : msg.user}:
            </span>
            <span className="chat-text">{msg.text}</span>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="primary" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
}
