import { motion } from 'framer-motion';
import { Copy, AlertCircle, FileText, Image, ChevronDown, Check, Sparkles, BookOpen, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';
import { ChatMessage as ChatMessageType } from '@/contexts/ChatContext';
import FinancialSummary from './FinancialSummary';
import BankStatementCard from './BankStatementCard';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const TypingIndicator = () => (
  <div className="flex items-center gap-2 py-2 px-1">
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-typing" />
      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-typing" style={{ animationDelay: '0.2s' }} />
      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-typing" style={{ animationDelay: '0.4s' }} />
    </div>
    <span className="text-[11px] font-mono text-slate-400 tracking-wider">REASONING OVER STATUTES &amp; STATEMENTS...</span>
  </div>
);

const ChatMessage = ({ message }: { message: ChatMessageType }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copied financial advice to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5`}
    >
      <div
        className={`${
          isUser ? 'max-w-[85%] lg:max-w-[75%]' : 'max-w-[98%] lg:max-w-[90%]'
        }`}
      >
        <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
          {/* Avatar */}
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
              isUser
                ? 'bg-[#151D2F] border border-white/10 text-cyan-400'
                : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 text-white border border-white/20'
            }`}
          >
            {isUser ? (
              <User size={15} />
            ) : (
              <Sparkles size={15} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header info (Sender label) */}
            <div className={`flex items-center gap-2 mb-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
              <span className="text-xs font-bold text-slate-300 font-sans">
                {isUser ? 'Taxpayer / You' : 'FINPILOT AI'}
              </span>
              {!isUser && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold">
                  CA REASONING
                </span>
              )}
            </div>

            {/* File attachment chip */}
            {message.fileName && (
              <div
                className={`flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl bg-[#0E1524] border border-white/10 text-xs w-fit ${
                  isUser ? 'ml-auto' : ''
                }`}
              >
                {message.fileType?.startsWith('image/') ? (
                  <Image size={13} className="text-emerald-400" />
                ) : (
                  <FileText size={13} className="text-emerald-400" />
                )}
                <span className="text-slate-300 truncate max-w-xs">{message.fileName}</span>
              </div>
            )}

            {/* Message bubble — hidden for bank summary cards (card replaces it) */}
            {(!message.bankSummary || message.isLoading || message.isError) && (
              <div
                className={`rounded-2xl px-5 py-4 ${
                  isUser
                    ? 'bg-gradient-to-br from-emerald-600/25 via-teal-600/20 to-indigo-600/20 border border-emerald-500/30 text-white shadow-lg'
                    : message.isError
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    : 'glass-card border border-white/[0.09] text-slate-100 shadow-xl'
                }`}
              >
                {message.isLoading ? (
                  <TypingIndicator />
                ) : message.isError ? (
                  <div className="flex items-center gap-2 text-rose-400">
                    <AlertCircle size={16} />
                    <span className="text-xs font-mono">{message.content}</span>
                  </div>
                ) : isUser ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none text-slate-200">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-base font-extrabold text-white mt-3 mb-2 font-display border-b border-white/10 pb-1">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-sm font-bold text-emerald-400 mt-3 mb-1.5 font-display">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xs font-bold text-cyan-300 mt-2.5 mb-1 font-display">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-xs sm:text-sm text-slate-200 mb-2 leading-relaxed">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-4 mb-2 space-y-1 text-xs sm:text-sm text-slate-300">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-4 mb-2 space-y-1 text-xs sm:text-sm text-slate-300">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-xs sm:text-sm text-slate-200">{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-bold text-white">{children}</strong>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-emerald-400 pl-3 italic text-slate-400 my-2 text-xs">
                            {children}
                          </blockquote>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-3 rounded-xl border border-white/10">
                            <table className="text-xs border-collapse w-full">{children}</table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="border-b border-white/10 px-3 py-2 text-left font-bold bg-white/[0.04] text-slate-200 uppercase font-mono text-[11px]">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border-b border-white/[0.06] px-3 py-2 text-slate-300 font-mono-num">
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {/* Bank statement upload card */}
            {!isUser && message.bankSummary && (
              <BankStatementCard data={message.bankSummary} filename={message.fileName} />
            )}

            {/* Financial summary (structured document upload) */}
            {!isUser && message.financialData && !message.bankSummary && (
              <FinancialSummary data={message.financialData} />
            )}

            {/* Retrieved ICAI RAG Chunks Collapsible */}
            {!isUser &&
              message.retrievedChunks &&
              message.retrievedChunks.length > 0 &&
              !message.isLoading &&
              !message.isError && (
                <Collapsible className="mt-2.5 border border-white/10 rounded-xl bg-[#0E1524]/60 overflow-hidden">
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors [&[data-state=open]_svg]:rotate-180">
                    <div className="flex items-center gap-2">
                      <BookOpen size={13} className="text-emerald-400" />
                      <span className="font-mono text-[11px]">
                        Statutory ICAI Corpus Citations ({message.retrievedChunks.length} chunks)
                      </span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform text-slate-400" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-3.5 pb-3 space-y-2 text-xs border-t border-white/[0.08] bg-[#070B13]/80 max-h-60 overflow-y-auto scrollbar-thin">
                    {message.retrievedChunks.map((ch, i) => (
                      <div
                        key={`${ch.chunk_id}-${i}`}
                        className="rounded-lg bg-[#0E1524] p-2.5 border border-white/[0.06] text-slate-300 font-mono text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-emerald-400 font-semibold uppercase">
                          <span>Level: {ch.level}</span>
                          <span>Chunk #{ch.chunk_id}</span>
                        </div>
                        <p className="text-slate-300 text-xs font-sans whitespace-pre-wrap">{ch.text}</p>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

            {/* Copy button for AI messages */}
            {!isUser && !message.isLoading && !message.isError && !message.bankSummary && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy Advice'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
