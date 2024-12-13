

import React, { useState } from 'react';
import axios from 'axios';

function Chatbot({ username }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Toggle chat visibility
  const toggleChat = () => setIsOpen(!isOpen);

  // Close the chatbot
  const closeChat = () => setIsOpen(false);

  // Handle sending message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    // Add the user's message
    setMessages([...messages, { sender: 'user', text: input }]);

    // Show bot's typing indicator
    setLoading(true);

    let botResponse = '';

    // Special case for greeting
    if (input.toLowerCase() === 'hi') {
      botResponse = `Hi ${username}, how may I help you?`;
    } else {
      try {
        // Send user input to backend API for matching questions
        const response = await axios.post('http://localhost:3000/chatbot', { query: input });

        // Check the response and display relevant questions
        if (response.data.questions) {
          // Format the questions as bullet points
          botResponse = (
            <ul>
              {response.data.questions.map((question, index) => (
                <li key={index}>{question}</li>
              ))}
            </ul>
          );
        } else if (response.data.message) {
          botResponse = response.data.message;
        }
      } catch (error) {
        botResponse = 'Sorry, there was an error with your request.';
      }
    }

    // Add bot's response
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: 'bot', text: botResponse },
    ]);
    
    setInput('');
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={toggleChat}
        className="chatbot-button"
        style={{ position: 'fixed', bottom: '20px', right: '20px' }}
      >
        Chat with us
      </button>

      {isOpen && (
        <div className="chatbot-container" style={{ position: 'fixed', bottom: '70px', right: '20px', width: '300px', border: '1px solid black', borderRadius: '10px', backgroundColor: 'white', padding: '10px' }}>
          <button onClick={closeChat} style={{ position: 'absolute', top: '10px', right: '10px' }}>X</button>
          <div className="chatbot-messages" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {messages.map((message, index) => (
              <div key={index} className={message.sender}>
                <strong>{message.sender === 'user' ? 'You' : 'Bot'}:</strong> {message.text}
              </div>
            ))}
            {loading && <div>Bot is typing...</div>}
          </div>
          <form onSubmit={sendMessage}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              style={{ width: '100%' }}
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </>
  );
}

export default Chatbot;
