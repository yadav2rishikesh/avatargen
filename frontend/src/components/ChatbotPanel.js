import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ChatbotPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            'Hi! I\'m your AI assistant for creating video scripts. Tell me what you\'d like your video to be about, and I\'ll help you craft the perfect script!',
        },
      ]);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat/message`, {
        session_id: sessionId,
        message: input,
      });

      const assistantMessage = { role: 'assistant', content: response.data.message };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          data-testid="chatbot-open-button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <Card
          data-testid="chatbot-panel"
          className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col border-slate-200"
        >
          {/* Header */}
          <div className="bg-primary text-white p-4 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">AI Assistant</h3>
                <p className="text-xs text-blue-100">Script creation helper</p>
              </div>
            </div>
            <Button
              data-testid="chatbot-close-button"
              size="icon"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-white border border-slate-200 text-slate-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="h-8 w-8 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-slate-200 rounded-b-xl">
            <div className="flex gap-2">
              <Textarea
                data-testid="chatbot-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="resize-none"
                rows={2}
                disabled={loading}
              />
              <Button
                data-testid="chatbot-send-button"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                size="icon"
                className="flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
