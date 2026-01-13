import React, { useState } from 'react';
import { Send, ShieldAlert, User, ChevronDown } from 'lucide-react';

export const ActionCenter = ({ state, setState }: any) => {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedRules, setSelectedRules] = useState(['', '', '']);
  const [isSending, setIsSending] = useState(false);

  const handleLog = async () => {
    if (!selectedStudent) return alert("❌ Thầy hãy chọn học sinh!");
    
    // 1. Lọc lấy các bản ghi lỗi đầy đủ từ bảng violations dựa trên Tên lỗi thầy đã chọn
    const activeViolationObjects = selectedRules
      .filter(name => name !== '')
      .map(name => state.violations.find((v: any) => v.nameRule === name))
      .filter(Boolean);

    if (activeViolationObjects.length === 0) return alert("❌ Thầy chưa chọn lỗi nào!");

    // 2. Chỉ lấy MÃ LỖI (codeRule) để gửi lên Sheet cho gọn
    const errorCodesOnly = activeViolationObjects.map(v => v.codeRule);

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
            payloads: errorCodesOnly, // GỬI MÃ (Vd: L01, L02)
            week: state.currentWeek
          })
        });
      }

      // 3. Cập nhật điểm trừ vào App (vẫn dùng points để tính toán)
      setState((prev: any) => {
        let totalDeduction = 0;
        activeViolationObjects.forEach(v => {
          totalDeduction += (Number(v.points) || 0);
        });

        return {
          ...prev,
          weeklyScores: prev.weeklyScores.map((score: any) => 
            score.idhs === selectedStudent
              ? { 
                  ...score, 
                  weeks: { 
                    ...score.weeks, 
                    [`w${prev.currentWeek}`]: (score.weeks[`w${prev.currentWeek}`] || 100) - totalDeduction 
                  } 
                }
              : score
          )
        };
      });

      alert(`✅ Đã ghi mã [${errorCodesOnly.join(", ")}] cho học sinh!`);
      setSelectedRules(['', '', '']);
      setSelectedStudent('');
    } catch (err) {
      alert("❌ Lỗi đồng bộ dữ liệu!");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
              <ShieldAlert className="text-rose-500" size={32} /> Ghi Nhận Vi Phạn
            </h2>
            <p className="text-slate-400 font-bold mt-1 uppercase text-[10px] tracking-[0.2em]">Tuần hiện tại: {state.currentWeek}</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Chọn Học sinh */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-5">1. Học sinh vi phạm</label>
            <div className="relative">
              <select 
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[30px] outline-none focus:border-indigo-500 font-bold text-slate-800 text-lg appearance-none transition-all shadow-inner"
              >
                <option value="">-- Chọn học sinh từ danh sách --</option>
                {state.students.map((s: any) => (
                  <option key={s.idhs} value={s.idhs}>{s.stt}. {s.name} ({s.idhs})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Chọn Lỗi */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-5">2. Chi tiết lỗi (Hiển thị Tên - Ghi vào Sheet Mã)</label>
            {selectedRules.map((rule, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-12 h-12 flex-shrink-0 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400">
                  {index + 1}
                </div>
                <div className="relative flex-1">
                  <select
                    value={rule}
                    onChange={(e) => {
                      const newRules = [...selectedRules];
                      newRules[index] = e.target.value;
                      setSelectedRules(newRules);
                    }}
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[25px] outline-none focus:border-rose-400 font-medium text-slate-700 appearance-none transition-all"
                  >
                    <option value="">-- Trống --</option>
                    {state.violations.map((v: any) => (
                      <option key={v.codeRule} value={v.nameRule}>
                         [{v.codeRule}] {v.nameRule}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleLog}
            disabled={isSending}
            className={`w-full py-6 rounded-[32px] font-black text-lg transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl ${
              isSending 
                ? 'bg-slate-100 text-slate-400' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {isSending ? "ĐANG LƯU DỮ LIỆU..." : <><Send size={20} /> XÁC NHẬN GHI LỖI</>}
          </button>
        </div>
      </div>
    </div>
  );
};
