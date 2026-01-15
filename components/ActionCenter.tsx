
import React, { useState } from 'react';
import { Send, ShieldAlert, ChevronDown, UserCircle2, AlertCircle } from 'lucide-react';

export const ActionCenter = ({ state, setState }: any) => {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedRules, setSelectedRules] = useState(['', '', '']);
  const [isSending, setIsSending] = useState(false);

  const handleLog = async () => {
    if (!selectedStudent) return alert("❌ Thầy hãy chọn học sinh!");
    
    // Lấy object quy tắc dựa trên tên đã chọn
    const activeViolationObjects = selectedRules
      .filter(name => name !== '')
      .map(name => state.violations.find((v: any) => v.nameRule === name))
      .filter(Boolean);

    if (activeViolationObjects.length === 0) return alert("❌ Thầy chưa chọn lỗi nào!");

    const codes = activeViolationObjects.map(v => v.codeRule);
    setIsSending(true);

    try {
      if (state.googleScriptUrl) {
        await fetch(state.googleScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({
            action: 'update_record',
            target: 'vipham',
            studentId: selectedStudent,
            payloads: codes
          })
        });
      }

      // ĐỒNG BỘ LOCAL ĐỂ CẬP NHẬT ĐIỂM NGAY (Tăng trải nghiệm người dùng)
      setState(prev => ({
        ...prev,
        violationLogs: prev.violationLogs.map(row => {
          if (String(row[1]).trim() === String(selectedStudent).trim()) {
            return [...row, ...codes];
          }
          return row;
        })
      }));

      alert(`✅ Đã ghi mã lỗi ${codes.join(', ')} thành công!`);
      setSelectedRules(['', '', '']);
      setSelectedStudent('');
    } catch (err) {
      alert("❌ Lỗi đồng bộ máy chủ!");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-white p-12 rounded-[56px] shadow-sm border border-slate-100">
        <div className="flex items-center gap-5 mb-12">
          <div className="w-16 h-16 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 shadow-sm">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Vi Phạm Nề Nếp</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Ghi nhận lỗi để trừ điểm thi đua</p>
          </div>
        </div>

        <div className="space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 flex items-center gap-2">
              <UserCircle2 size={14}/> 1. Chọn học sinh vi phạm
            </label>
            <div className="relative group">
              <select 
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full p-7 bg-slate-50 border-2 border-slate-100 rounded-[35px] outline-none font-black text-slate-800 text-lg appearance-none group-focus-within:border-rose-500 transition-all"
              >
                <option value="">-- Click để chọn học sinh --</option>
                {state.students.map((s: any) => (
                  <option key={s.idhs} value={s.idhs}>{s.stt}. {s.name} ({s.idhs})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-rose-500" />
            </div>
          </div>

          <div className="space-y-5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 flex items-center gap-2">
              <AlertCircle size={14}/> 2. Chi tiết các lỗi (Tối đa 3 lỗi)
            </label>
            {selectedRules.map((rule, index) => (
              <div key={index} className="flex items-center gap-5">
                <div className="w-14 h-14 shrink-0 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 text-xl border border-slate-200">{index + 1}</div>
                <div className="relative flex-1 group">
                  <select
                    value={rule}
                    onChange={(e) => {
                      const newRules = [...selectedRules];
                      newRules[index] = e.target.value;
                      setSelectedRules(newRules);
                    }}
                    className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[30px] outline-none font-bold text-slate-700 appearance-none group-focus-within:border-indigo-500 transition-all"
                  >
                    <option value="">-- Chọn lỗi vi phạm --</option>
                    {state.violations.map((v: any) => (
                      <option key={v.codeRule} value={v.nameRule}>[{v.codeRule}] {v.nameRule} (-{v.points}đ)</option>
                    ))}
                  </select>
                  <ChevronDown size={20} className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-indigo-500" />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleLog}
            disabled={isSending}
            className={`w-full py-7 rounded-[35px] font-black text-xl transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 ${
              isSending ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-rose-600 shadow-rose-100'
            }`}
          >
            {isSending ? (
              <div className="animate-pulse flex items-center gap-3">ĐANG XỬ LÝ...</div>
            ) : (
              <><Send size={24} /> GHI NHẬN VI PHẠM</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
