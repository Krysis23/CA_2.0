import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  PanelLeftClose,
  BarChart3,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
  Sparkles,
  LogOut,
  User,
} from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import Logo from './Logo';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const ChatSidebar = ({ isOpen, onToggle }: ChatSidebarProps) => {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    deleteConversation,
    renameConversation,
    activeConversation,
  } = useChat();
  const { user, logout } = useAuth();

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const startRename = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(title);
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) renameConversation(id, editTitle.trim());
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const groupConversationsByDate = (convs: typeof conversations) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const lastWeek = today - 7 * 86400000;

    const groups: { [key: string]: typeof conversations } = {
      Today: [],
      Yesterday: [],
      'Last 7 Days': [],
      Older: [],
    };

    convs.forEach((c) => {
      const time = new Date(c.updatedAt).getTime();
      if (time >= today) groups['Today'].push(c);
      else if (time >= yesterday) groups['Yesterday'].push(c);
      else if (time >= lastWeek) groups['Last 7 Days'].push(c);
      else groups['Older'].push(c);
    });

    return groups;
  };

  const groups = groupConversationsByDate(filtered);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed lg:relative z-50 w-72 h-full bg-[#080C14] border-r border-white/[0.08] flex flex-col select-none"
          >
            {/* Top Bar with FinPilot Branding */}
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#080C14]/90 backdrop-blur-md">
              <div>
                <Logo size="sm" />
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-mono font-semibold tracking-wider text-emerald-400/90 uppercase">
                    TAX REASONING FY 25-26
                  </span>
                </div>
              </div>
              <button
                onClick={onToggle}
                className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
                title="Collapse sidebar"
              >
                <PanelLeftClose size={17} />
              </button>
            </div>

            {/* Quick Actions & Navigation */}
            <div className="p-3 space-y-2 border-b border-white/[0.08]">
              {/* New Financial Audit CTA */}
              <button
                onClick={createConversation}
                className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] group"
              >
                <Plus size={15} className="transition-transform group-hover:rotate-90 duration-300" />
                New Financial Audit
              </button>

              {/* Navigation Items */}
              <div className="space-y-1 pt-1">
                {/* ITR Hub Nav */}
                <NavLink
                  to="/itr-hub"
                  className={({ isActive }) =>
                    `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet size={15} className="text-indigo-400" />
                    <span>ITR Filing Hub</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold">
                    GUIDED
                  </span>
                </NavLink>

                {/* Dashboard Analytics Nav */}
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 size={15} className="text-emerald-400" />
                    <span>Financial Analytics</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                    RECHARTS
                  </span>
                </NavLink>
              </div>

              {/* Search Audits Input */}
              <div className="relative pt-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search audit sessions..."
                  className="w-full bg-[#0E1524] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
                />
              </div>
            </div>

            {/* Active Document Badge (if loaded in active chat) */}
            {activeConversation?.docData && typeof activeConversation.docData === 'object' && (
              <div className="mx-3 my-2.5 p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-emerald-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-white truncate">
                      {(String((activeConversation.docData as { person_name?: string; person_entity?: string }).person_name ||
                        (activeConversation.docData as { person_name?: string; person_entity?: string }).person_entity ||
                        'Taxpayer Document'))}
                    </p>
                    <p className="text-[9px] font-mono text-emerald-400/80 uppercase">
                      {(String((activeConversation.docData as { document_type?: string }).document_type || 'BANK STATEMENT')).replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Conversation History List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2 space-y-4">
              {filtered.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-10 px-4">
                  {search ? 'No matching audits found' : 'No audit sessions yet. Click "New Financial Audit" to start.'}
                </div>
              ) : (
                Object.entries(groups).map(([label, items]) => {
                  if (items.length === 0) return null;
                  return (
                    <div key={label} className="space-y-1">
                      <p className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase px-2 py-1">
                        {label}
                      </p>
                      {items.map((conv) => {
                        const isActive = conv.id === activeConversationId;
                        const isEditing = editingId === conv.id;

                        return (
                          <div
                            key={conv.id}
                            onClick={() => setActiveConversationId(conv.id)}
                            className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                              isActive
                                ? 'bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 border border-emerald-500/30 text-white font-medium shadow-sm'
                                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 flex-1 mr-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="w-full bg-[#0E1524] border border-emerald-500/40 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  onClick={(e) => saveRename(conv.id, e)}
                                  className="text-emerald-400 hover:text-emerald-300 p-0.5"
                                >
                                  <Check size={12} />
                                </button>
                                <button onClick={cancelRename} className="text-slate-400 hover:text-slate-200 p-0.5">
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="truncate flex-1 pr-2">{conv.title || 'Untitled Audit'}</span>
                                <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={(e) => startRename(conv.id, conv.title, e)}
                                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                                    title="Rename"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteConversation(conv.id);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                                    title="Delete"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* User Profile & Workspace Footer */}
            <div className="p-3 border-t border-white/[0.08] bg-[#080C14]/90 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-emerald-500/20 shrink-0">
                    <User size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{user?.name || 'Chartered User'}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email || 'firm@finpilot.ai'}</p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Sign out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatSidebar;
