import { useState, useCallback } from 'react';
import { Send, Paperclip, X, FileText, Image, Sparkles, ArrowUp } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useChat } from '@/contexts/ChatContext';

const ChatInput = () => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { sendMessage, isProcessing } = useChat();

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

  const handleSend = async () => {
    if ((!text.trim() && !file) || isProcessing) return;
    const msg = text.trim();
    const f = file;
    setText('');
    setFile(null);
    await sendMessage(msg || (f ? `Analyze this file: ${f.name}` : ''), f || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      {...getRootProps()}
      className={`relative z-20 border-t border-white/[0.08] bg-[#0A0F1D]/90 backdrop-blur-xl p-4 lg:px-6 transition-colors ${
        isDragActive ? 'bg-emerald-500/10 border-emerald-500/40' : ''
      }`}
    >
      <input {...getInputProps()} />

      <div className="max-w-4xl mx-auto">
        {/* Drag Active Banner */}
        {isDragActive && (
          <div className="text-center text-emerald-400 text-xs mb-3 py-3 border-2 border-dashed border-emerald-500/40 rounded-xl bg-emerald-500/5 font-mono animate-pulse">
            Drop your statement PDF or image to extract and audit...
          </div>
        )}

        {/* Selected File Chip */}
        {file && (
          <div className="flex items-center gap-2.5 mb-2.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl w-fit text-xs backdrop-blur-md">
            {file.type.startsWith('image/') ? (
              <Image size={14} className="text-emerald-400" />
            ) : (
              <FileText size={14} className="text-emerald-400" />
            )}
            <span className="text-slate-200 font-medium truncate max-w-xs">{file.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </span>
            <button
              onClick={() => setFile(null)}
              className="text-slate-400 hover:text-rose-400 transition-colors p-0.5 rounded-full hover:bg-white/10"
              title="Remove file"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Main Input Capsule */}
        <div className="flex items-center gap-2 p-1.5 pl-3 bg-[#0E1524] border border-white/10 rounded-2xl shadow-xl focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
          {/* File Attach Button */}
          <button
            type="button"
            onClick={open}
            disabled={isProcessing}
            className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-all disabled:opacity-40 shrink-0"
            title="Attach bank statement (PDF, PNG, JPG)"
          >
            <Paperclip size={18} />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            placeholder={
              file
                ? 'Add audit instructions for this statement (or press Enter)...'
                : 'Ask FinPilot about Income Tax sections, GST, slabs, or upload bank statement...'
            }
            className="w-full bg-transparent border-0 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-0 px-2 py-1.5 disabled:opacity-50 font-sans"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={(!text.trim() && !file) || isProcessing}
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 shrink-0"
            title="Send query"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowUp size={18} strokeWidth={2.4} />
            )}
          </button>
        </div>

        {/* Footer Hint */}
        <div className="flex items-center justify-between px-2 pt-2 text-[10px] font-mono text-slate-500">
          <span>Supported: PDF, PNG, JPG, WEBP (Bank Statements, Form 16)</span>
          <span className="hidden sm:inline">Press Enter ↵ to send</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
