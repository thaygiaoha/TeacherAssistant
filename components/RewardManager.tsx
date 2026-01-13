import React, { useState } from 'react';
import { Trophy, Send, Star, Users, ChevronDown } from 'lucide-react';

export const RewardManager = ({ state, setState }: any) => {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [targetSheet, setTargetSheet] = useState('thanhtich'); 
  const [selectedRewardCode, setSelectedRewardCode] = useState(''); // Lưu Mã thưởng
  const [isSending, setIsSending] = useState(false);

  // Danh sách sẽ thay đổi tùy theo việc thầy chọn tab nào
  const currentList = targetSheet === 'thanhtich' ? state.rewards : state.bch;

  // Trong file RewardManager.tsx, sửa lại hàm handleReward:
const handleReward = async () => {
  if (!selectedStudent || !selectedRewardCode) return alert("❌ Thầy vui lòng chọn đủ thông tin!");

  setIsSending(true);
  try {
    if (state.googleScriptUrl) {
      await fetch(state.googleScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          action: 'update_record',
          target: targetSheet, // 'thanhtich' hoặc 'bch'
          studentId: selectedStudent,
          payload: selectedRewardCode, // Gửi mã (ví dụ: T01, LT)
          week: state.currentWeek
        })
      });
    }
    alert(`🎉 Đã ghi mã [${selectedRewardCode}] vào sheet THƯỞNG!`);
    setSelectedRewardCode('');
    setSelectedStudent('');
  } catch (err) {
    alert("❌ Lỗi đồng bộ!");
  } finally {
    setIsSending(false);
  }
};

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100">
        
        {/* Tiêu đề */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
              <Trophy className="text-amber-500" size={32} /> Vinh Danh & Khen Thưởng
            </h2>
            <p className="text-slate-400 font-bold mt-1 uppercase text-[10px] tracking-[0.2em]">
              Tuần hiện tại: {state.currentWeek}
            </p>
          </div>
        </div>

        <div className="space-y-8">
          
          {/* 1. Chọn Mục Thưởng (Tab) */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => { setTargetSheet('thanhtich'); setSelectedRewardCode(''); }}
              className={`p-6 rounded-[30px] border-2 transition-all flex flex-col items-center gap-2 ${
                targetSheet === 'thanhtich' 
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                : 'border-slate-100 text-slate-400 opacity-60'
              }`}
            >
              <Star size={24} />
              <span className="font-black text-sm uppercase">Thành tích</span>
            </button>
            <button
              onClick={() => { setTargetSheet('bch'); setSelectedRewardCode(''); }}
              className={`p-6 rounded-[30px] border-2 transition-all flex flex-col items-center gap-2 ${
                targetSheet === 'bch' 
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' 
                : 'border-slate-100 text-slate-400 opacity-60'
              }`}
            >
              <Users size={24} />
              <span className="font-black text-sm uppercase">Ban cán sự</span>
            </button>
          </div>

          {/* 2. Chọn Học sinh */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-5 block">
              1. Học sinh được khen thưởng
            </label>
            <div className="relative">
              <select 
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[30px] outline-none focus:border-emerald-500 font-bold text-slate-800 text-lg appearance-none transition-all shadow-inner"
              >
                <option value="">-- Chọn học sinh từ danh sách --</option>
                {state.students.map((s: any) => (
                  <option key={s.idhs} value={s.idhs}>{s.stt}. {s.name} ({s.idhs})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* 3. Chọn Nội dung thưởng (ĐÃ SỬA TỪ TEXTAREA SANG SELECT) */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-5 block">
              2. Nội dung khen thưởng (Danh sách sổ xuống)
            </label>
            <div className="relative">
              <select
                value={selectedRewardCode}
                onChange={(e) => setSelectedRewardCode(e.target.value)}
                className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[30px] outline-none focus:border-emerald-500 font-bold text-slate-700 text-lg appearance-none transition-all shadow-inner"
              >
                <option value="">-- Chọn nội dung khen thưởng --</option>
                {currentList && currentList.map((item: any) => (
                  <option key={item.codeRule} value={item.codeRule}>
                    [{item.codeRule}] {item.nameRule}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Nút gửi */}
          <button
            onClick={handleReward}
            disabled={isSending}
            className={`w-full py-6 rounded-[32px] font-black text-lg transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl ${
              isSending 
                ? 'bg-slate-100 text-slate-400' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
            }`}
          >
            {isSending ? "ĐANG LƯU DỮ LIỆU..." : <><Send size={20} /> XÁC NHẬN KHEN THƯỞNG</>}
          </button>

        </div>
      </div>
    </div>
  );
};
