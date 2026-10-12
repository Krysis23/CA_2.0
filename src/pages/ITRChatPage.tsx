import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, Loader2, Paperclip, X, FileText, Image, Download, ShieldCheck, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Logo from '@/components/Logo';

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
      content: 'Hello! I am your FinPilot AI Tax Assistant. To determine your correct ITR form (ITR-1 through ITR-4) and generate your filing checklist, could you describe your income sources (e.g. salary, house property, business turnover, or capital gains)?'
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
          if (session.accumulatedData) setAccumulatedData(session.accumulatedData);
          if (session.chatState) setChatState(session.chatState);
        }
      } catch (err) {
        console.error("Error restoring session:", err);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveCurrentSession = useCallback((
    updatedMessages: Message[], 
    updatedData: Record<string, any>, 
    updatedState: ChatState
  ) => {
    try {
      const existing = JSON.parse(localStorage.getItem("ca_agent_itr_sessions") ?? "[]");
      const filtered = existing.filter((s: any) => s.id !== sessionId);
      
      const newSession = {
        id: sessionId,
        date: new Date().toISOString(),
        itrForm: updatedState.itr_form,
        fields: Object.keys(updatedData).length,
        stage: updatedState.stage,
        messages: updatedMessages,
        accumulatedData: updatedData,
        chatState: updatedState
      };
      
      localStorage.setItem("ca_agent_itr_sessions", JSON.stringify([newSession, ...filtered]));
    } catch (err) {
      console.error("Failed to save session", err);
    }
  }, [sessionId]);

  const handleNewSession = () => {
    const newId = `itr_${Date.now()}`;
    setSessionId(newId);
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        content: 'Hello! I am your FinPilot AI Tax Assistant. To determine your correct ITR form (ITR-1 through ITR-4) and generate your filing checklist, could you describe your income sources (e.g. salary, house property, business turnover, or capital gains)?'
      }
    ]);
    setAccumulatedData({});
    setChatState({
      bot_reply: '',
      itr_form: null,
      checklist: [],
      missing_info: [],
      stage: 'collecting'
    });
    navigate('/itr-chat');
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1
  });

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !file) || isLoading) return;

    const userText = input.trim();
    const attachedFile = file;
    setInput('');
    setFile(null);

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      content: userText || (attachedFile ? `Uploaded document: ${attachedFile.name}` : '')
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      let currentDocData = accumulatedData;

      if (attachedFile) {
        toast.info("Extracting financial data from document...");
        const formData = new FormData();
        formData.append('file', attachedFile);
        formData.append('context', 'itr');

        const uploadRes = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          currentDocData = { ...currentDocData, ...(uploadData.doc_data || {}) };
          setAccumulatedData(currentDocData);
          toast.success("Document extracted successfully!");
        } else {
          toast.error("Failed to extract document, proceeding with message only.");
        }
      }

      const historyPayload = newMessages
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.content
        }));

      const res = await fetch('http://localhost:8000/api/itr/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: historyPayload,
          context: chatState.stage,
          doc_data: currentDocData
        })
      });

      if (!res.ok) {
        throw new Error("Failed to communicate with ITR assistant");
      }

      const data = await res.json();
      
      const botMessage: Message = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        content: data.reply || "I've processed your details.",
        options: data.options || []
      };

      const updatedMessagesWithBot = [...newMessages, botMessage];
      setMessages(updatedMessagesWithBot);

      const updatedChatState: ChatState = {
        bot_reply: data.reply,
        itr_form: data.itr_form || chatState.itr_form,
        checklist: data.checklist || chatState.checklist,
        missing_info: data.missing_info || chatState.missing_info,
        stage: data.stage || chatState.stage
      };
      setChatState(updatedChatState);

      saveCurrentSession(updatedMessagesWithBot, currentDocData, updatedChatState);

    } catch (err: any) {
      toast.error(err.message || "An error occurred");
      setMessages(prev => [
        ...prev, 
        { 
          id: `err_${Date.now()}`, 
          sender: 'bot', 
          content: "Sorry, I encountered an issue processing your request. Please try again." 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const exportPDF = () => {
    if (!chatState.checklist || chatState.checklist.length === 0) {
      toast.error("No checklist items available to download.");
      return;
    }

    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text("FINPILOT - Income Tax Return Checklist", 14, 22);
      
      doc.setFontSize(12);
      doc.text(`Recommended Form: ${chatState.itr_form || "Pending Determination"}`, 14, 32);
      
      let currentY = 40;
      doc.setFontSize(14);
      doc.text("Required Documents:", 14, currentY);
      currentY += 5;
      
      const checklistData = chatState.checklist.map(item => [item]);
      
      autoTable(doc, {
        startY: currentY,
        head: [['Document Name']],
        body: checklistData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 10;
      
      if (chatState.missing_info && chatState.missing_info.length > 0) {
        doc.setFontSize(14);
        doc.text("Missing Details to Confirm:", 14, currentY);
        currentY += 5;
        const missingData = chatState.missing_info.map(item => [item]);
        autoTable(doc, {
          startY: currentY,
          head: [['Missing Info / Verification']],
          body: missingData,
          theme: 'grid',
          headStyles: { fillColor: [245, 158, 11] },
        });
      }

      doc.save(`FINPILOT_ITR_Checklist_${chatState.itr_form || 'Filing'}.pdf`);
      toast.success("Checklist PDF downloaded!");
    } catch (e) {
      toast.error("Failed to generate PDF.");
    }
  };

  return (
    <div className="flex h-screen bg-[#070B13] text-white overflow-hidden fin-grid-pattern">
      {/* Sidebar for ITR Status */}
      <div className="w-80 border-r border-white/[0.08] bg-[#080C14] p-5 flex flex-col hidden md:flex shrink-0 select-none">
        <Link
          to="/itr-hub"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={15} /> Back to ITR Hub
        </Link>
        
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
          </div>
          <button 
            onClick={handleNewSession}
            className="text-[10px] font-mono font-bold text-slate-400 hover:text-emerald-400 transition-colors border border-white/10 px-2.5 py-1 rounded-lg hover:bg-white/5"
          >
            New Session
          </button>
        </div>
        
        <div className="space-y-5 flex-1 overflow-y-auto scrollbar-thin pr-1">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase mb-1.5">Filing Stage</p>
            <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider ${
              chatState.stage === 'ready' 
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                : 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300'
            }`}>
              {chatState.stage}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase mb-1.5">Classified Form</p>
            <div className="p-3 rounded-xl bg-[#0E1524] border border-white/[0.08]">
              <span className="text-base font-black text-white font-display">
                {chatState.itr_form || "Analyzing criteria..."}
              </span>
            </div>
          </div>

          {chatState.missing_info.length > 0 && chatState.stage !== 'ready' && (
            <div>
              <p className="text-[10px] font-mono font-bold text-amber-400 uppercase mb-1.5">Missing Info</p>
              <ul className="space-y-1.5 text-xs text-amber-300/80 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                {chatState.missing_info.map((info, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{info}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {chatState.checklist.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">Document Checklist</p>
                <button 
                  onClick={exportPDF}
                  className="p-1 hover:bg-white/10 text-emerald-400 rounded-lg transition-colors"
                  title="Download PDF Checklist"
                >
                  <Download size={14} />
                </button>
              </div>
              <ul className="space-y-1.5 text-xs">
                {chatState.checklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-[#0E1524] p-2.5 rounded-xl border border-white/[0.06] text-slate-300">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#070B13] relative">
        <header className="h-16 border-b border-white/[0.08] bg-[#0A0F1D]/80 backdrop-blur-xl flex items-center justify-between px-5 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <Link to="/itr-hub" className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 md:hidden">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-400" />
              <h2 className="text-xs font-bold text-white font-sans">FinPilot Guided ITR Filing Assistant</h2>
            </div>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold uppercase">
            FORM ENGINE
          </span>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin z-10">
          {messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 text-xs sm:text-sm leading-relaxed shadow-lg ${
                msg.sender === 'user' 
                  ? 'bg-gradient-to-br from-emerald-600/30 via-teal-600/25 to-indigo-600/20 border border-emerald-500/30 text-white rounded-tr-sm' 
                  : 'glass-card text-slate-200 rounded-tl-sm border border-white/[0.08]'
              }`}>
                {msg.sender === 'bot' ? (
                  <div className="prose prose-sm prose-invert max-w-none text-slate-200">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              
              {/* Options Pills */}
              {msg.options && msg.options.length > 0 && msg.sender === 'bot' && (
                <div className="flex flex-wrap gap-2 mt-2.5 max-w-[85%] md:max-w-[75%]">
                  {msg.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(opt);
                        setTimeout(() => {
                          const formEvent = new Event('submit', { bubbles: true, cancelable: true }) as unknown as React.FormEvent;
                          handleSend(formEvent);
                        }, 10);
                      }}
                      disabled={isLoading}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#0E1524] border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition-all disabled:opacity-50 shadow-sm"
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
              <div className="glass-card text-slate-300 rounded-2xl rounded-tl-sm border border-white/[0.08] px-4 py-3 flex items-center gap-2 text-xs">
                <Loader2 size={15} className="animate-spin text-emerald-400" />
                <span className="font-mono text-[11px]">Evaluating tax schedules &amp; disclosures...</span>
              </div>
            </div>
          )}
          
          {chatState.stage === 'ready' && chatState.checklist.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center pt-4 pb-2"
            >
              <div className="glass-card border border-emerald-500/40 rounded-2xl p-6 text-center max-w-md w-full shadow-2xl">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="text-white font-bold text-sm mb-1 font-display">Filing Checklist Ready</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Your income profile has been classified for {chatState.itr_form || 'your return'}. Download your statutory checklist to finalize.
                </p>
                <button
                  onClick={exportPDF}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-xs font-bold rounded-xl transition-all w-full justify-center shadow-lg shadow-emerald-500/25"
                >
                  <Download size={15} />
                  Download Complete PDF Checklist
                </button>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div 
          {...getRootProps()}
          className={`p-4 bg-[#0A0F1D]/90 border-t border-white/[0.08] backdrop-blur-xl transition-colors z-20 ${
            isDragActive ? 'bg-emerald-500/10 border-emerald-500/40' : ''
          }`}
        >
          <input {...getInputProps()} />
          
          {isDragActive && (
            <div className="text-center text-emerald-400 text-xs mb-3 py-2 border-2 border-dashed border-emerald-500/40 rounded-xl bg-emerald-500/5 font-mono">
              Drop supporting tax document here...
            </div>
          )}

          {file && (
            <div className="flex items-center gap-2 mb-2.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl w-fit text-xs backdrop-blur-md">
              {file.type.startsWith('image/') ? <Image size={13} className="text-emerald-400" /> : <FileText size={13} className="text-emerald-400" />}
              <span className="text-slate-200 truncate max-w-xs">{file.name}</span>
              <button onClick={() => setFile(null)} className="text-slate-400 hover:text-rose-400 p-0.5">
                <X size={12} />
              </button>
            </div>
          )}

          <div className="max-w-4xl mx-auto flex items-center gap-2 p-1 pl-3 bg-[#0E1524] border border-white/10 rounded-2xl focus-within:border-emerald-500/50">
            <button
              onClick={open}
              disabled={isLoading}
              className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-colors disabled:opacity-40 shrink-0"
              title="Attach statement or Form 16"
            >
              <Paperclip size={17} />
            </button>
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
              placeholder={chatState.stage === 'ready' ? "Filing is ready, ask any further questions..." : "Specify your income sources, deductions, or answer questions..."}
              className="w-full bg-transparent border-0 px-2 py-2 text-xs sm:text-sm text-white focus:outline-none placeholder:text-slate-500 disabled:opacity-50 font-sans"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !file) || isLoading}
              className="w-9 h-9 shrink-0 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
