import { SparklesIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { extractStory } from '../api/assistantApi.js';
import CurrencyInput from './CurrencyInput.jsx';

const AiImportModal = ({ isOpen, onClose, jars, onSaveBulk }) => {
  const [story, setStory] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!story.trim()) {
      setError('Vui lòng kể lại hoạt động chi tiêu của bạn.');
      return;
    }
    try {
      setIsAnalyzing(true);
      setError('');
      setDrafts([]);
      const response = await extractStory({ story });
      if (response.transactions && response.transactions.length > 0) {
        setDrafts(response.transactions);
      } else {
        setError('AI không tìm thấy giao dịch nào trong câu chuyện của bạn.');
      }
    } catch (err) {
      setError(err.message || 'Không thể phân tích bằng AI.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateDraft = (index, field, value) => {
    const updated = [...drafts];
    updated[index] = { ...updated[index], [field]: value };
    setDrafts(updated);
  };

  const removeDraft = (index) => {
    setDrafts(drafts.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (drafts.length === 0) return;
    try {
      setIsSaving(true);
      await onSaveBulk(drafts);
      setStory('');
      setDrafts([]);
      onClose();
    } catch (err) {
      setError(err.message || 'Lưu thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d20] shadow-2xl shadow-black/50 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 shrink-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <SparklesIcon className="h-5 w-5 text-indigo-400" />
            Nhập nhanh bằng AI
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

          <div className="space-y-2">
            <p className="text-[13px] text-slate-400">
              Kể lại hoạt động của bạn. Ví dụ: "Sáng nay đổ xăng 50k, đi chợ mua thịt cá 150k. Hôm qua đi cafe với bạn 40k. Chiều được nhận lương 10tr."
            </p>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Nhập câu chuyện chi tiêu..."
              rows={4}
              className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-sm text-white outline-none focus:border-indigo-500/50"
            />
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !story.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <span className="animate-pulse">Đang phân tích...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  Phân tích
                </>
              )}
            </button>
          </div>

          {drafts.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Kiểm tra & Xác nhận ({drafts.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-white/[0.06] bg-white/[0.02]">
                    <tr>
                      <th className="px-3 py-2 font-medium">Ngày</th>
                      <th className="px-3 py-2 font-medium">Mô tả</th>
                      <th className="px-3 py-2 font-medium">Số tiền</th>
                      <th className="px-3 py-2 font-medium">Hũ</th>
                      <th className="px-3 py-2 font-medium">Thu/Chi</th>
                      <th className="px-3 py-2 font-medium">Loại</th>
                      <th className="px-3 py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {drafts.map((draft, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="px-2 py-2">
                          <input type="date" value={draft.date} onChange={(e) => updateDraft(idx, 'date', e.target.value)} className="w-[120px] bg-transparent text-xs outline-none" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={draft.description} onChange={(e) => updateDraft(idx, 'description', e.target.value)} className="w-[150px] bg-transparent outline-none" />
                        </td>
                        <td className="px-2 py-2">
                          <CurrencyInput value={draft.amount} onChange={(e) => updateDraft(idx, 'amount', e.target.value)} className="w-[80px] bg-transparent font-medium text-white outline-none" />
                        </td>
                        <td className="px-2 py-2">
                          <select value={draft.jar_key} onChange={(e) => updateDraft(idx, 'jar_key', e.target.value)} className="w-[110px] bg-transparent text-xs outline-none">
                            {jars.map(j => <option key={j.jar_key} value={j.jar_key}>{j.display_name_vi}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <select value={draft.direction} onChange={(e) => updateDraft(idx, 'direction', e.target.value)} className="w-[80px] bg-transparent text-xs outline-none">
                            <option value="expense">Chi (-)</option>
                            <option value="income_adjustment">Thu (+)</option>
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <select value={draft.category} onChange={(e) => updateDraft(idx, 'category', e.target.value)} className="w-[110px] bg-transparent text-xs outline-none">
                            <option value="uncategorized">Để AI phân loại</option>
                            <option value="food_drink">Ăn uống</option>
                            <option value="bills">Hóa đơn</option>
                            <option value="investment">Đầu tư</option>
                            <option value="learning">Học tập</option>
                            <option value="family">Gia đình</option>
                            <option value="charity">Từ thiện</option>
                            <option value="personal_care">Chăm sóc cá nhân</option>
                            <option value="shopping">Mua sắm</option>
                            <option value="transport">Di chuyển</option>
                            <option value="health">Sức khỏe</option>
                            <option value="entertainment">Giải trí</option>
                          </select>
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button onClick={() => removeDraft(idx)} className="text-slate-500 hover:text-rose-400">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {isSaving ? 'Đang lưu...' : 'Xác nhận Lưu'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiImportModal;
