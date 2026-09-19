import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, Loader2, Paperclip, X, FileText, Image, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  options?: string[];
}

interface ChatState {
  bot_reply: string;
  itr_form: string | null;
  checklist: string[];
  missing_info: string[];
  stage: string;
}

export default function ITRChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      content: 'Hello! I am your AI Chartered Accountant. To help you determine your ITR form and generate a document checklist, could you tell me a bit about your income sources (e.g., salary, business, capital gains, etc.)?'
    }
  ]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [accumulatedData, setAccumulatedData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [chatState, setChatState] = useState<ChatState>({
    bot_reply: '',
    itr_form: null,
    checklist: [],
    missing_info: [],
    stage: 'collecting'
  });
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string>(() => searchParams.get('sessionId') || `itr_${Date.now()}`);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sid = searchParams.get('sessionId');
    if (sid) {
      try {
        const sessions = JSON.parse(localStorage.getItem("ca_agent_itr_sessions") ?? "[]");
        const session = sessions.find((s: any) => s.id === sid);
        if (session) {
          if (session.messages) setMessages(session.messages);
          if (session.chatState) setChatState(session.chatState);
          if (session.accumulatedData) setAccumulatedData(session.accumulatedData);
          setSessionId(sid);
        }
      } catch (e) {
        console.error("Failed to load session", e);
      }
    }
  }, [searchParams]);

  const handleNewSession = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        content: 'Hello! I am your AI Chartered Accountant. To help you determine your ITR form and generate a document checklist, could you tell me a bit about your income sources (e.g., salary, business, capital gains, etc.)?'
      }
    ]);
    setInput('');
    setFile(null);
    setAccumulatedData({});
    setChatState({
      bot_reply: '',
      itr_form: null,
      checklist: [],
      missing_info: [],
      stage: 'collecting'
    });
    const newId = `itr_${Date.now()}`;
    setSessionId(newId);
    navigate('/itr-chat', { replace: true });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Save session snapshot to localStorage for ITR Hub recent sessions
  const saveSession = (state: ChatState, currentMessages: Message[], currentData: any) => {
    try {
      const sessions = JSON.parse(localStorage.getItem("ca_agent_itr_sessions") ?? "[]");
      const snapshot = {
        id: sessionId,
        date: new Date().toISOString(),
        itrForm: state.itr_form,
        fields: state.checklist.length,
        stage: state.stage,
        messages: currentMessages,
        chatState: state,
        accumulatedData: currentData
      };
      
      const existing = sessions.findIndex((s: any) => s.id === sessionId);
      if (existing >= 0) {
        sessions[existing] = { ...sessions[existing], ...snapshot };
      } else {
        sessions.unshift(snapshot);
      }
      localStorage.setItem("ca_agent_itr_sessions", JSON.stringify(sessions.slice(0, 10)));
    } catch {
      // localStorage write failure — non-critical
    }
  };

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const exportPDF = () => {
    if (chatState.checklist.length === 0) return;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Income Tax Return (ITR) Checklist", 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Recommended Form: ${chatState.itr_form || "Unknown"}`, 14, 32);
    
    let currentY = 42;
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Required Documents:", 14, currentY);
    currentY += 5;
    
    const checklistData = chatState.checklist.map(item => [item]);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Document Name']],
      body: checklistData,
      theme: 'grid',
      headStyles: { fillColor: [20, 184, 166] },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 10;
    
    if (chatState.missing_info.length > 0) {
       doc.setFontSize(14);
       doc.text("Additional Details Needed:", 14, currentY);
       currentY += 5;
       const missingData = chatState.missing_info.map(item => [item]);
       autoTable(doc, {
         startY: currentY,
         head: [['Detail / Question']],
         body: missingData,
         theme: 'grid',
         headStyles: { fillColor: [245, 158, 11] },
       });
    }

    doc.save(`ITR_Checklist_${chatState.itr_form || 'Unknown'}.pdf`);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !file) || isLoading) return;

    let userMessage = input.trim();
    if (file && !userMessage) userMessage = `I have uploaded a document: ${file.name}`;

    setInput('');
    const currentFile = file;
    setFile(null);
    
    const newUserMsg: Message = { id: Date.now().toString(), sender: 'user', content: userMessage };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      let newExtractedData = { ...accumulatedData };

      if (currentFile) {
        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('context', 'itr');
        const uploadRes = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) throw new Error('File upload failed');
        const uploadData = await uploadRes.json();
        if (uploadData.doc_data) {
           newExtractedData = { ...newExtractedData, ...uploadData.doc_data };
           setAccumulatedData(newExtractedData);
        }
      }
      // Build history payload
      const historyPayload = [];
      let currentUser = "";
      for (const msg of messages) {
        if (msg.sender === 'user') {
          currentUser = msg.content;
        } else if (msg.sender === 'bot') {
          if (currentUser) {
            historyPayload.push({ user: currentUser, assistant: msg.content });
            currentUser = "";
          } else {
            historyPayload.push({ user: "", assistant: msg.content });
          }
        }
      }
      if (currentUser) {
         historyPayload.push({ user: currentUser, assistant: "" });
      }

      const res = await fetch('http://localhost:8000/api/itr/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          history: historyPayload,
          extracted_data: newExtractedData,
          current_stage: chatState.stage
        })
      });

      if (!res.ok) throw new Error('Failed to get response');
      const data: ChatState = await res.json();
      
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        sender: 'bot', 
        content: data.bot_reply || 'Okay.',
        options: (data as any).mcq_options || []
      };
      
      setChatState(data);
      setMessages(prev => {
        const newMessages = [...prev, botMsg];
        saveSession(data, newMessages, newExtractedData);
        return newMessages;
      });

    } catch (err) {
      toast.error("Failed to connect to assistant.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar for ITR Status */}
      <div className="w-80 border-r border-border bg-card p-6 flex flex-col hidden md:flex">
        <Link to="/itr-hub" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft size={16} /> Back to Hub
        </Link>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-foreground">Filing Status</h2>
          <button 
            onClick={handleNewSession}
            className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors border border-border px-2 py-1 rounded hover:bg-muted"
          >
            New Session
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Stage</p>
            <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize
              ${chatState.stage === 'ready' ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary'}`}>
              {chatState.stage}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">ITR Form</p>
            <p className="text-sm font-medium text-foreground">
              {chatState.itr_form || "Analyzing..."}
            </p>
          </div>

          {chatState.missing_info.length > 0 && chatState.stage !== 'ready' && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Missing Info</p>
              <ul className="list-disc pl-4 space-y-1">
                {chatState.missing_info.map((info, idx) => (
                  <li key={idx} className="text-sm text-amber-500/80">{info}</li>
                ))}
              </ul>
            </div>
          )}

          {chatState.checklist.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Document Checklist</p>
                <button 
                  onClick={exportPDF}
                  className="p-1 hover:bg-muted text-teal-500 rounded transition-colors"
                  title="Download PDF Checklist"
                >
                  <Download size={14} />
                </button>
              </div>
              <ul className="space-y-2">
                {chatState.checklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="text-success mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur flex items-center px-4 shrink-0 md:hidden">
           <Link to="/itr-hub" className="mr-2 text-muted-foreground"><ArrowLeft size={18} /></Link>
           <h2 className="text-sm font-medium">ITR Assistant</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin">
          {messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm
                ${msg.sender === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                  : 'bg-muted text-foreground rounded-tl-sm border border-border prose prose-sm prose-invert prose-p:leading-relaxed prose-pre:bg-background/50 prose-pre:border prose-pre:border-border'
                }`}
              >
                {msg.sender === 'bot' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
              
              {/* MCQ Options Rendering */}
              {msg.options && msg.options.length > 0 && msg.sender === 'bot' && (
                <div className="flex flex-wrap gap-2 mt-3 max-w-[80%] md:max-w-[70%]">
                  {msg.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                         setInput(opt);
                         // Small hack to ensure state is set before submitting
                         setTimeout(() => {
                           const formEvent = new Event('submit', { bubbles: true, cancelable: true }) as unknown as React.FormEvent;
                           handleSend(formEvent);
                         }, 10);
                      }}
                      disabled={isLoading}
                      className="px-4 py-2 text-xs font-medium rounded-full bg-background border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground rounded-2xl rounded-tl-sm border border-border px-4 py-3 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
          
          {chatState.stage === 'ready' && chatState.checklist.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center pt-4 pb-2"
            >
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 text-center max-w-sm w-full">
                <h3 className="text-emerald-500 font-semibold mb-2">Filing Checklist Ready!</h3>
                <p className="text-xs text-muted-foreground mb-4">You have successfully completed the assessment. Download your personalized checklist to proceed with your filing.</p>
                <button
                  onClick={exportPDF}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors w-full justify-center shadow-lg shadow-emerald-500/20"
                >
                  <Download size={16} />
                  Download PDF Checklist
                </button>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div 
          {...getRootProps()}
          className={`p-4 bg-background border-t border-border transition-colors ${isDragActive ? 'bg-primary/5 border-primary/30' : ''}`}
        >
          <input {...getInputProps()} />
          
          {isDragActive && (
            <div className="text-center text-primary text-sm mb-3 py-3 border-2 border-dashed border-primary/30 rounded-lg">
              Drop your file here...
            </div>
          )}

          {file && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-muted/50 border border-border rounded-lg w-fit mx-auto md:mx-0">
              {file.type.startsWith('image/') ? <Image size={14} className="text-primary" /> : <FileText size={14} className="text-primary" />}
              <span className="text-sm text-muted-foreground truncate max-w-48">{file.name}</span>
              <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="max-w-4xl mx-auto flex items-end gap-2">
            <button
              onClick={open}
              disabled={isLoading}
              className="p-3.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-50 shrink-0"
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>
            <div className="flex-1 bg-input border border-border rounded-xl focus-within:ring-2 focus-within:ring-primary/50 transition-all flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={chatState.stage === 'ready' ? "Filing is ready, but you can ask more..." : "Type your answer or upload a doc..."}
                className="w-full bg-transparent px-4 py-3.5 text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/50 disabled:opacity-50"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !file) || isLoading}
              className="w-12 h-12 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
