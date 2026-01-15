import React, { useState } from 'react';
import { Trophy, Users, ChevronDown, Award, Star } from 'lucide-react';

export const RewardManager = ({ state, setState }: any) => {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [targetType, setTargetType] = useState<'thanhtich' | 'bch'>('thanhtich'); 
  const [selectedRewardCode, setSelectedRewardCode] = useState(''); 
  const [isSending, setIsSending] = useState(false);

  // Logic tách danh sách dựa trên nút bấm
  const currentList = targetType === 'thanhtich' ? state.rewards : (state.bchRules || []);

  const handleReward = async () => {
    if (!selectedStudent || !selectedRewardCode) return alert("❌ Thầy hãy chọn học sinh và nội dung!");

    setIsSending(true);
    try {
      if (state.googleScriptUrl) {
        // GIỮ NGUYÊN: Vẫn ghi vào target: 'thuong' trên Google Sheet
        await fetch(state.googleScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({
            action: 'update_record',
            target: 'thuong', 
            studentId: selectedStudent,
            payload: selectedRewardCode, 
          })
        });
      }

      // CẬP NHẬT LOCAL LOGS GỮ NGUYÊN LOGIC CŨ
      setState((prev: any) => ({
        ...prev,
        rewardLogs: prev.rewardLogs.map((row: any[]) => {
          if (String(row[1]).trim() === String(selectedStudent).trim()) {
            return [...row, selectedRewardCode];
          }
          return row;
        })
      }));

      alert(`🎉 Đã cộng mã [${selectedRewardCode}] thành công!`);
      setSelectedRewardCode('');
    } catch (e) {
      alert("❌ Lỗi kết nối!");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5">
      <div className="bg-white p-10 rounded-[50px] shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          
          {/* CHỌN HỌC SINH */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-5 flex items-center gap-2">
              <Users size={12}/> Đối tượng khen thưởng
            </label>
            <div className="relative group">
              <select 
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[30px] outline-none font-bold text-slate-700 appearance-none focus:border-emerald-500 transition-all"
              >
                <option value="">-- Chọn học sinh --</option>
                {state.students.map((s: any) => (
                  <option key={s.idhs} value={s.idhs}>{s.stt}. {s.name} ({s.idhs})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            </div>
          </div>

          {/* CHỌN LOẠI THƯỞNG (Nội dung 1) */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-5 flex items-center gap-2">
              <Star size={12}/> Phân loại mục thưởng
            </label>
            <div className="flex bg-slate-100 p-1.5 rounded-[25px] gap-1">
              <button 
                onClick={() => { setTargetType('thanhtich'); setSelectedRewardCode(''); }}
                className={`flex-1 py-4 rounded-[20px] text-[10px] font-black transition-all uppercase ${targetType === 'thanhtich' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
              >
                Thành tích cá nhân
              </button>
              <button 
                onClick={() => { setTargetType('bch'); setSelectedRewardCode(''); }}
                className={`flex-1 py-4 rounded-[20px] text-[10px] font-black transition-all uppercase ${targetType === 'bch' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                Điểm BCH / Cán sự
              </button>
            </div>
          </div>
        </div>

        {/* CHỌN NỘI DUNG THƯỞNG THEO DANH SÁCH ĐÃ TÁCH */}
        <div className="space-y-3 mb-10">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-5">Nội dung khen thưởng cụ thể</label>
          <div className="relative group">
            <select 
              value={selectedRewardCode}
              onChange={(e) => setSelectedRewardCode(e.target.value)}
              className="w-full p-7 bg-slate-50 border-2 border-slate-100 rounded-[35px] outline-none font-black text-slate-700 text-lg appearance-none focus:border-emerald-500 transition-all"
            >
              <option value="">-- Click để chọn mã thưởng --</option>
              {currentList.map((item: any) => (
                <option key={item.codeRule} value={item.codeRule}>
                  [{item.codeRule}] {item.nameRule} (+{item.points}đ)
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={handleReward}
          disabled={isSending}
          className={`w-full py-8 rounded-[35px] font-black text-xl transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 ${
            isSending ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-emerald-100'
          }`}
        >
          {isSending ? <div className="animate-pulse">ĐANG GỬI DỮ LIỆU...</div> : <><Trophy size={24}/> XÁC NHẬN THƯỞNG</>}
        </button>
      </div>
    </div>
  );
};
