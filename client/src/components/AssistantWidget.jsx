import {
  ChatBubbleOvalLeftEllipsisIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { chatWithAssistant } from '../api/assistantApi.js';
import { getPageMeta } from '../config/navigation.js';

const createMessage = (role, content, provider = '') => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  provider
});

const AssistantWidget = () => {
  const location = useLocation();
  const pageMeta = useMemo(() => getPageMeta(location.pathname), [location.pathname]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState(() => [
    createMessage(
      'assistant',
      `Xin chào, tôi là trợ lý AI của website này. Tôi có thể hỗ trợ theo đúng dữ liệu hiện tại của app và bối cảnh trang "${pageMeta.title}".`
    )
  ]);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const scrollArea = scrollAreaRef.current;

    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [isOpen, isLoading, messages]);

  const sendMessage = async (rawValue) => {
    const nextMessage = rawValue.trim();

    if (!nextMessage || isLoading) {
      return;
    }

    setMessages((currentMessages) => [...currentMessages, createMessage('user', nextMessage)]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatWithAssistant({
        message: nextMessage,
        page_path: location.pathname,
        page_title: pageMeta.title
      });

      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage('assistant', response.message, response.provider || '')
      ]);
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage('assistant', error.message || 'Không gọi được trợ lý AI thật lúc này.')
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await sendMessage(inputValue);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed inset-x-4 bottom-24 z-50 flex max-h-[72vh] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/96 shadow-2xl shadow-black/40 backdrop-blur sm:left-auto sm:right-4 sm:w-[390px] lg:bottom-24 lg:right-6"
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-white/5 px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-(--hero-gradient) text-white shadow-lg shadow-indigo-900/40">
                  <SparklesIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Trợ lý AI</p>
                  <p className="text-xs text-slate-400">Dùng AI thật, ưu tiên provider còn quota</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Đóng trợ lý"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div ref={scrollAreaRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={[
                      'max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap',
                      message.role === 'user'
                        ? 'bg-(--hero-gradient) text-white shadow-lg shadow-indigo-900/30'
                        : 'border border-white/10 bg-white/5 text-slate-100'
                    ].join(' ')}
                  >
                    {message.content}
                    {message.provider ? (
                      <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        Provider: {message.provider}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

              {isLoading ? (
                <div className="flex justify-start">
                  <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    Trợ lý đang suy nghĩ...
                  </div>
                </div>
              ) : null}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage(inputValue);
              }}
              className="border-t border-white/10 bg-slate-950/95 p-4"
            >
              <div className="flex items-end gap-3">
                <textarea
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder="Hỏi về dữ liệu hiện tại, cách dùng web, hoặc tư vấn tài chính..."
                  className="min-h-[56px] flex-1 resize-none rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400/50 focus:bg-white/8"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-(--hero-gradient) text-white shadow-lg shadow-indigo-900/35 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Gửi tin nhắn"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </form>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-(--hero-gradient) text-white shadow-2xl shadow-indigo-900/40 transition hover:scale-[1.03] lg:bottom-6 lg:right-6"
        aria-label="Mở trợ lý AI"
        whileTap={{ scale: 0.96 }}
      >
        <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6" />
      </motion.button>
    </>
  );
};

export default AssistantWidget;
