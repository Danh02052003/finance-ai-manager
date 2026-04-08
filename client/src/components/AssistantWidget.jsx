import {
  ChatBubbleOvalLeftEllipsisIcon,
  MapIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { chatWithAssistant } from '../api/assistantApi.js';
import { getPageMeta } from '../config/navigation.js';

const createMessage = (role, content, provider = '', navigation = null) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  provider,
  navigation
});

const AssistantWidget = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pageMeta = useMemo(() => getPageMeta(location.pathname), [location.pathname]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState(() => [
    createMessage(
      'assistant',
      `Xin chào! Tôi là trợ lý AI, sẵn sàng hỗ trợ bạn với dữ liệu trang "${pageMeta.title}".`
    )
  ]);
  const scrollAreaRef = useRef(null);
  const pendingNavigationRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
  }, [isOpen, isLoading, messages]);

  const scrollToAssistantTarget = (targetId) => {
    if (!targetId) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    let attempts = 0;
    const tryScroll = () => {
      const el = document.querySelector(`[data-assistant-target="${targetId}"]`);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      attempts += 1;
      if (attempts < 16) window.setTimeout(tryScroll, 180);
    };
    tryScroll();
  };

  useEffect(() => {
    if (!pendingNavigationRef.current) return;
    const { path, targetId } = pendingNavigationRef.current;
    if (location.pathname === path) {
      scrollToAssistantTarget(targetId);
      pendingNavigationRef.current = null;
    }
  }, [location.pathname, location.search]);

  const applyNavigation = (navigationInstruction) => {
    if (!navigationInstruction || !navigationInstruction.path) return;
    const query = new URLSearchParams(navigationInstruction.query || {});
    if (navigationInstruction.path === '/transactions' && navigationInstruction.target_id === 'transactions-editor' && !query.has('quickAdd')) {
      query.set('quickAdd', '1');
    }
    const nextUrl = `${navigationInstruction.path}${query.toString() ? `?${query.toString()}` : ''}`;
    const nextPath = navigationInstruction.path;
    const currentUrl = `${location.pathname}${location.search}`;
    pendingNavigationRef.current = { path: nextPath, targetId: navigationInstruction.target_id || '' };
    if (currentUrl === nextUrl) { scrollToAssistantTarget(navigationInstruction.target_id || ''); pendingNavigationRef.current = null; return; }
    navigate(nextUrl);
  };

  const sendMessage = async (rawValue) => {
    const nextMessage = rawValue.trim();
    if (!nextMessage || isLoading) return;
    setMessages((m) => [...m, createMessage('user', nextMessage)]);
    setInputValue('');
    setIsLoading(true);
    try {
      const response = await chatWithAssistant({ message: nextMessage, page_path: location.pathname, page_title: pageMeta.title });
      setMessages((m) => [...m, createMessage('assistant', response.message, response.provider || '', response.navigation || null)]);
      applyNavigation(response.navigation);
    } catch (err) {
      setMessages((m) => [...m, createMessage('assistant', err.message || 'Không kết nối được trợ lý AI.')]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); await sendMessage(inputValue); }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.section
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-x-4 bottom-20 z-50 flex max-h-[72vh] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgba(10,10,26,0.97)] shadow-2xl shadow-black/40 backdrop-blur-xl sm:left-auto sm:right-4 sm:w-[380px] lg:bottom-20 lg:right-6"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-(--hero-gradient) text-white">
                  <SparklesIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Trợ lý AI</p>
                  <p className="text-[11px] text-slate-500">Hỏi bất cứ điều gì</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.08] hover:text-white" aria-label="Đóng">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollAreaRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((msg) => (
                <div key={msg.id} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={['max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap', msg.role === 'user' ? 'bg-indigo-500 text-white' : 'border border-white/[0.06] bg-white/[0.04] text-slate-200'].join(' ')}>
                    {msg.content}
                    {msg.provider ? <div className="mt-1.5 text-[10px] uppercase tracking-wider text-slate-500">{msg.provider}</div> : null}
                    {msg.role === 'assistant' && msg.navigation?.path ? (
                      <button type="button" onClick={() => applyNavigation(msg.navigation)} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-white/[0.08]">
                        <MapIcon className="h-3 w-3" />Mở
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}

              {isLoading ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] px-4 py-2.5 text-sm text-slate-400">
                    <span className="inline-flex gap-1">
                      <span className="animate-pulse">·</span>
                      <span className="animate-pulse" style={{ animationDelay: '0.15s' }}>·</span>
                      <span className="animate-pulse" style={{ animationDelay: '0.3s' }}>·</span>
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue); }} className="border-t border-white/[0.06] p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Hỏi về dữ liệu, cách dùng, tư vấn..."
                  className="min-h-[40px] flex-1 resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/40"
                />
                <button type="submit" disabled={isLoading || !inputValue.trim()} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--hero-gradient) text-white transition hover:scale-[1.02] disabled:opacity-40" aria-label="Gửi">
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </div>
            </form>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-(--hero-gradient) text-white shadow-xl shadow-indigo-900/30 transition hover:scale-105 lg:bottom-6 lg:right-6"
        aria-label="Mở trợ lý AI"
        whileTap={{ scale: 0.95 }}
      >
        <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />
      </motion.button>
    </>
  );
};

export default AssistantWidget;
