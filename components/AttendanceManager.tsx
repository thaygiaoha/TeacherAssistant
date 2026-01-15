
import React, { useState } from 'react';
import { UserCheck, Send } from 'lucide-react';

export const AttendanceManager = ({ state }: any) => {
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const handleUpdateStatus = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const submitAttendance = async () => {
    if (!state.googleScriptUrl) return alert("Chưa có link Script!");
    setLoading(true);
    try {
      let count = 0;
      for (const s of state.students) {
        const status = attendance[s.idhs] || 'OK'; 
        
        // CHỈ GỬI NẾU KHÁC 'OK'
        if (status === 'P' || status === 'KP') {
          count++;
          const finalPayload = `${status} (${dateStr})`;
          await fetch(state.googleScriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
              action: 'update_record',
              target: 'diemdanh',
              studentId: s.idhs,
              payload: finalPayload
            })
          });
        }
      }
      alert(`✅ Đã đồng bộ ${count} học sinh nghỉ học lên Google Sheet!`);
    } catch (e) {
      alert("Lỗi kết nối!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Điểm danh lớp</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Ngày {dateStr} (Chỉ ghi nhận HS vắng)
          </p>
        </div>
        <button 
          onClick={submitAttendance}
          disabled={loading}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg text-xs uppercase tracking-widest"
        >
          {loading ? "Đang gửi..." : <><Send size={18}/> Xác nhận vắng</>}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {state.students.map((s: any) => (
          <div key={s.idhs} className="bg-white p-5 rounded-[30px] border border-slate-50 flex items-center justify-between hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 uppercase text-xs">
                 {s.stt}
               </div>
               <div>
                 <span className="font-black text-slate-700 uppercase text-sm block">{s.name}</span>
                 <span className="text-[10px] text-slate-400 font-bold uppercase">{s.idhs}</span>
               </div>
            </div>
            
            <div className="flex gap-2 bg-slate-50 p-1.5 rounded-[20px]">
              {[
                { id: 'OK', label: 'CÓ MẶT', color: 'bg-emerald-500' },
                { id: 'P', label: 'PHÉP (P)', color: 'bg-amber-500' },
                { id: 'KP', label: 'K.PHÉP (KP)', color: 'bg-rose-500' }
              ].map((btn) => {
                const isSelected = attendance[s.idhs] === btn.id || (!attendance[s.idhs] && btn.id === 'OK');
                return (
                  <button
                    key={btn.id}
                    onClick={() => handleUpdateStatus(s.idhs, btn.id)}
                    className={`px-5 py-3 rounded-[15px] text-[10px] font-black transition-all uppercase tracking-widest ${
                      isSelected ? `${btn.color} text-white shadow-md scale-105` : 'text-slate-300 hover:text-slate-500'
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
