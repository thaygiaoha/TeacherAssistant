import React, { useState } from 'react';
import { UserCheck, Send, Check } from 'lucide-react';

export const AttendanceManager = ({ state }: any) => {
  // Quan trọng: Khởi tạo giá trị mặc định là 'OK' cho từng học sinh để không bị lỗi chọn chung
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const today = new Date();
// Ép định dạng dd/mm/yyyy thủ công để luôn có số 0 ở trước
const day = String(today.getDate()).padStart(2, '0');
const month = String(today.getMonth() + 1).padStart(2, '0');
const year = today.getFullYear();

const dateStr = `${day}/${month}/${year}`;
const payload = status + " " + dateStr; // Kết quả: "P 13/01/2026"

  const handleUpdateStatus = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status // Chỉ cập nhật đúng ID của học sinh đó
    }));
  };

  const submitAttendance = async () => {
  if (!state.googleScriptUrl) return alert("Chưa có link Script!");
  setLoading(true);
  
  // Gom tất cả trạng thái của cả lớp vào 1 mảng
  const bulkUpdates = state.students.map((s: any) => ({
    studentId: s.idhs,
    payload: (attendance[s.idhs] || 'OK') + " " + dateStr
  }));

  try {
    await fetch(state.googleScriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        action: 'update_attendance_bulk',
        target: 'diemdanh',
        updates: bulkUpdates // Gửi nguyên danh sách
      })
    });
    alert("✅ Đã điểm danh xong cả lớp!");
  } catch (err) {
    alert("❌ Lỗi kết nối!");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Điểm danh lớp</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Ngày {dateStr}
          </p>
        </div>
        <button 
          onClick={submitAttendance}
          disabled={loading}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg"
        >
          {loading ? "Đang gửi..." : <><Send size={18}/> Ghi nhận</>}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {state.students.map((s: any) => (
          <div key={s.idhs} className="bg-white p-5 rounded-[30px] border border-slate-50 flex items-center justify-between hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 uppercase text-xs">
                 {s.name.split(' ').pop()?.charAt(0)}
               </div>
               <span className="font-bold text-slate-700">{s.name}</span>
            </div>
            
            <div className="flex gap-2 bg-slate-50 p-1.5 rounded-[20px]">
              {[
                { id: 'OK', label: 'CÓ', color: 'bg-emerald-500' },
                { id: 'P', label: 'P', color: 'bg-amber-500' },
                { id: 'KP', label: 'KP', color: 'bg-rose-500' }
              ].map((btn) => {
                // Kiểm tra trạng thái hiện tại của từng em
                const isSelected = attendance[s.idhs] === btn.id || (!attendance[s.idhs] && btn.id === 'OK');
                return (
                  <button
                    key={btn.id}
                    onClick={() => handleUpdateStatus(s.idhs, btn.id)}
                    className={`px-5 py-2.5 rounded-[15px] text-[10px] font-black transition-all ${
                      isSelected ? `${btn.color} text-white shadow-md scale-105` : 'text-slate-400 hover:text-slate-600'
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
