import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { Plus, Trash2, MessageSquare, Edit2, Check, X, PanelLeftClose, PanelLeft, BarChart3 } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import Logo from '@/components/Logo';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const ChatSidebar = ({ isOpen, onToggle }: ChatSidebarProps) => {
  const {
    conversations,
    activeConversationId,
    activeConversation,
    createConversation,
    deleteConversation,
    renameConversation,
    setActiveConversation,
  } = useChat();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startRename = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const confirmRename = () => {
    if (editingId && editTitle.trim()) {
      renameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return 'Today';
    if (diff < 172800000) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed lg:relative z-50 w-72 h-full bg-card border-r border-border flex flex-col"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <Logo size="sm" />
              <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">
                <PanelLeftClose size={18} />
              </button>
            </div>

            <div className="p-3 space-y-2">
              <button
                onClick={createConversation}
                className="w-full gradient-primary text-primary-foreground text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 glow-hover transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus size={16} />
                New Chat
              </button>

              {/* ── ITR Hub — primary nav item ── */}
              <NavLink
                to="/itr-hub"
                className={({ isActive }) =>
                  `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors
                   ${isActive
                     ? "bg-purple-600 text-white shadow-sm shadow-purple-600/25"
                     : "text-foreground hover:bg-muted hover:text-foreground"
                   }`
                }
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>
                </svg>
                ITR Hub
              </NavLink>

              {/* ── Dashboard — secondary nav item ── */}
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                   ${isActive
                     ? "bg-muted text-foreground"
                     : "text-muted-foreground hover:bg-muted hover:text-foreground"
                   }`
                }
              >
                <BarChart3 size={16} className="shrink-0" />
                Dashboard
              </NavLink>

              <hr className="border-border my-1" />
            </div>

            {activeConversation?.docData && typeof activeConversation.docData === 'object' && (
              <div className="mx-3 mb-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
                <p className="font-medium text-foreground">
                  {(String((activeConversation.docData as { document_type?: string }).document_type || 'document'))
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase())}{' '}
                  loaded
                </p>
                <p className="text-muted-foreground truncate mt-0.5">
                  {(activeConversation.docData as { person_name?: string }).person_name || ''}
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-3">
              {conversations.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No conversations yet
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map(conv => (
                    <motion.div
                      key={conv.id}
                      layout
                      className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                        conv.id === activeConversationId
                          ? 'bg-muted/80 text-foreground'
                          : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                      }`}
                      onClick={() => setActiveConversation(conv.id)}
                    >
                      <MessageSquare size={14} className="shrink-0" />
                      <div className="flex-1 min-w-0">
                        {editingId === conv.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              ref={inputRef}
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setEditingId(null); }}
                              className="w-full bg-input border border-border rounded px-2 py-0.5 text-sm text-foreground"
                              onClick={e => e.stopPropagation()}
                            />
                            <button onClick={(e) => { e.stopPropagation(); confirmRename(); }} className="text-success"><Check size={14} /></button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="text-destructive"><X size={14} /></button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm truncate">{conv.title}</p>
                            <p className="text-xs text-muted-foreground/60">{formatDate(conv.updatedAt)}</p>
                          </>
                        )}
                      </div>
                      {editingId !== conv.id && (
                        <div className="hidden group-hover:flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); startRename(conv.id, conv.title); }}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                            className="p-1 rounded hover:bg-destructive/20 text-destructive transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Collapse toggle when sidebar is hidden */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-all hover:bg-muted"
        >
          <PanelLeft size={18} />
        </button>
      )}
    </>
  );
};

export default ChatSidebar;
