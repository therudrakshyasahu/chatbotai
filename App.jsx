import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, FileText, Database, Bot, User, Loader2, AlertCircle } from 'lucide-react';

// --- CONFIGURATION ---
// SET THIS TO false WHEN RUNNING LOCALLY WITH PYTHON BACKEND
const DEMO_MODE = false; 
const API_URL = "http://localhost:8000";

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Database className="text-blue-400" />
            <span>AcademicBot</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Institutional Knowledge Base</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'chat' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
          >
            <Bot size={20} />
            <span>Chat Assistant</span>
          </button>
          <button 
            onClick={() => setActiveTab('upload')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'upload' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
          >
            <Upload size={20} />
            <span>Upload Data</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className={`w-2 h-2 rounded-full ${DEMO_MODE ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            {DEMO_MODE ? 'Demo Mode (using API)' : 'Connected to Backend'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'chat' ? <ChatInterface /> : <UploadInterface />}
      </div>
    </div>
  );
}

// --- CHAT COMPONENT ---
function ChatInterface() {
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hello! I am your academic research assistant. I have access to the organizational database. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let data;
      
      if (DEMO_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        data = {
          answer: "This is a simulated response in Demo Mode. To get real answers, set DEMO_MODE to false in the code and run the Python backend. I would typically answer based on the uploaded PDFs here.",
          sources: ["demo_document.pdf", "research_guidelines.pdf"]
        };
      } else {
        // Real API Call
        const response = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: userMessage.content }),
        });
        
        if (!response.ok) throw new Error('API Error');
        data = await response.json();
      }

      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: data.answer,
        sources: data.sources
      }]);

    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I encountered an error connecting to the server. Please ensure the backend is running." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Research Assistant</h2>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
              </div>

              <div className="flex flex-col gap-1">
                <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="text-xs text-slate-400 ml-1 flex flex-wrap gap-2">
                    <span className="font-semibold">Sources:</span>
                    {msg.sources.map((src, i) => (
                      <span key={i} className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{src.split('/').pop()}</span>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 ml-11">
              <Loader2 className="animate-spin text-blue-500" size={16} />
              <span className="text-xs text-slate-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question about the uploaded documents..."
            className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Send size={18} />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// --- UPLOAD COMPONENT ---
function UploadInterface() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');

    if (DEMO_MODE) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStatus('success');
      setMessage(`Successfully simulated upload for ${file.name}`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const result = await response.json();
      setStatus('success');
      setMessage(`Success! Added ${result.chunks_added} chunks to the knowledge base.`);
    } catch (error) {
      setStatus('error');
      setMessage('Failed to upload file. Is the backend running?');
    }
  };

  return (
    <div className="h-full bg-slate-50 p-8 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Knowledge</h2>
        <p className="text-slate-500 mb-8">Add PDF documents to the organizational database. The chatbot will be able to answer questions based on this content.</p>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 mb-6 hover:bg-slate-50 transition-colors relative">
          <input 
            type="file" 
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {file ? (
            <div className="flex items-center justify-center gap-2 text-blue-600 font-medium">
              <FileText size={20} />
              {file.name}
            </div>
          ) : (
            <div className="text-slate-400">
              Click to select a PDF file
            </div>
          )}
        </div>

        <button 
          onClick={handleUpload}
          disabled={!file || status === 'uploading'}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {status === 'uploading' && <Loader2 className="animate-spin" size={18} />}
          {status === 'uploading' ? 'Processing...' : 'Upload Document'}
        </button>

        {status === 'success' && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">
            {message}
          </div>
        )}
        {status === 'error' && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center gap-2">
            <AlertCircle size={16} />
            {message}
          </div>
        )}
      </div>
    </div>
  );
}