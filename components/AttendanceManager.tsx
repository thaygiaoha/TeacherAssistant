import React, { useState } from 'react';
import { Send, X, Plus, Trash2 } from 'lucide-react';

export const AttendanceManager = ({ state }: any) => {
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingList, setPendingList] = useState<any[]>([]);

  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  // Hàm tạo 1 dòng nghỉ mặc định
  const createDefaultRange = () => ({
    id: Math.random().toString(36).substr(2, 9),
    dd: String(today.getDate()).padStart(2, '0'),
    mm: String(today.getMonth() + 1).padStart(2, '0'),
    yyyy: String(today.getFullYear()),
    endDate: '',
    break: 'N',
    lido: 'Do sức khỏe'
  });

  const prepareAttendance = () => {
    const list = state.students
      .filter((s: any) => attendance[s.idbgd] === 'P' || attendance[s.idbgd] === 'KP')
      .map((s: any) => ({
        idbgd: s.idbgd,
        name: s.name,
        class: s.class,
        displayType: attendance[s.idbgd],
        ranges: [createDefaultRange()] // Mỗi HS mặc định có 1 đợt nghỉ
      }));

    if (list.length === 0) return alert("Chưa chọn học sinh vắng nào!");
    setPendingList(list);
    setShowModal(true);
  };

  // Hàm thêm dòng nghỉ mới cho 1 học sinh
  const addRange = (studentId: string) => {
    setPendingList(prev => prev.map(s => 
      s.idbgd === studentId ? { ...s, ranges: [...s.ranges, createDefaultRange()] } : s
    ));
  };

  // Hàm xóa dòng nghỉ
  const removeRange = (studentId: string, rangeId: string) => {
    setPendingList(prev => prev.map(s => {
      if (s.idbgd === studentId) {
        if (s.ranges.length <= 1) return s; // Giữ lại ít nhất 1 dòng
        return { ...s, ranges: s.ranges.filter((r: any) => r.id !== rangeId) };
      }
      return s;
    }));
  };

  // Hàm cập nhật dữ liệu trong từng dòng
  const updateRangeItem = (studentId: string, rangeId: string, field: string, value: string) => {
    setPendingList(prev => prev.map(s => {
      if (s.idbgd === studentId) {
        return {
          ...s,
          ranges: s.ranges.map((r: any) => r.id === rangeId ? { ...r, [field]: value } : r)
        };
      }
      return s;
    }));
  };

  const getDatesInRange = (startStr: string, endStr: string) => {
    const dates = [];
    let curr = new Date(startStr);
    const end = new Date(endStr || startStr);
    while (curr <= end) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const submitAttendance = async () => {
    setLoading(true);
    let finalBatch: any[] = [];

    pendingList.forEach(student => {
      student.ranges.forEach((range: any) => {
        const dates = getDatesInRange(`${range.yyyy}-${range.mm}-${range.dd}`, range.endDate);
        dates.forEach(d => {
          finalBatch.push({
            idbgd: student.idbgd,
            name: student.name,
            class: student.class,
            type: student.displayType === 'KP' ? 'K' : student.displayType,
            dd: String(d.getDate()).padStart(2, '0'),
            mm: String(d.getMonth() + 1).padStart(2, '0'),
            yyyy: String(d.getFullYear()),
            break: range.break,
            lido: range.lido
          });
        });
      });
    });

    try {
      await fetch(state.googleScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'save_attendance_batch', payload: finalBatch })
      });
      alert(`✅ Đã gửi ${finalBatch.length} ngày nghỉ thành công!`);
      setShowModal(false);
      setAttendance({});
    } catch (e) {
      alert("Lỗi kết nối!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* ... Giữ nguyên phần danh sách học sinh bên ngoài ... */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Điểm danh</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Ngày {dateStr}</p>
        </div>
        <button onClick={prepareAttendance} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg text-xs uppercase tracking-widest hover:bg-slate-900 transition-all">
          Tiếp tục ({state.students.filter((s:any) => attendance[s.idbgd] === 'P' || attendance[s.idbgd] === 'KP').length})
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {state.students.map((s: any) => (
          <div key={s.idbgd} className="bg-white p-4 rounded-[30px] border border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs">{s.stt}</div>
              <span className="font-black text-slate-700 uppercase text-sm">{s.name}</span>
            </div>
            <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl">
              {['OK', 'P', 'KP'].map((id) => (
                <button key={id} onClick={() => setAttendance(prev => ({ ...prev, [s.idbgd]: id }))}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                    (attendance[s.idbgd] === id || (!attendance[s.idbgd] && id === 'OK')) 
                    ? (id === 'OK' ? 'bg-emerald-500 text-white' : id === 'P' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white') : 'text-slate-300'
                  }`}>
                  {id === 'OK' ? 'CÓ MẶT' : id}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 uppercase tracking-tight">Chi tiết ngày nghỉ</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X/></button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-8 bg-white">
              {pendingList.map((student) => (
                <div key={student.idbgd} className="space-y-4 pb-6 border-b border-dashed border-slate-200 last:border-0">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-indigo-600 uppercase text-base">{student.name}</span>
                    <button onClick={() => addRange(student.idbgd)} className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-all">
                      <Plus size={14}/> THÊM ĐỢT NGHỈ
                    </button>
                  </div>

                  {student.ranges.map((range: any, index: number) => (
                    <div key={range.id} className="p-4 rounded-3xl bg-slate-50 space-y-3 relative border border-slate-100 shadow-sm animate-in slide-in-from-top-2">
                      {student.ranges.length > 1 && (
                        <button onClick={() => removeRange(student.idbgd, range.id)} className="absolute -top-2 -right-2 bg-white text-rose-500 p-1.5 rounded-full shadow-md hover:bg-rose-50 transition-all">
                          <Trash2 size={14}/>
                        </button>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3 text-[10px] font-black text-slate-400 uppercase px-2">
                        <span>Từ ngày</span>
                        <span>Đến ngày (nếu có)</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <input type="date" defaultValue={`${range.yyyy}-${range.mm}-${range.dd}`} 
                          onChange={(e) => {
                            const [y, m, d] = e.target.value.split('-');
                            updateRangeItem(student.idbgd, range.id, 'dd', d);
                            updateRangeItem(student.idbgd, range.id, 'mm', m);
                            updateRangeItem(student.idbgd, range.id, 'yyyy', y);
                          }} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" />
                        
                        <input type="date" onChange={(e) => updateRangeItem(student.idbgd, range.id, 'endDate', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-rose-500" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <select value={range.break} onChange={(e) => updateRangeItem(student.idbgd, range.id, 'break', e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
                          <option value="N">Cả ngày (N)</option>
                          <option value="S">Sáng (S)</option>
                          <option value="C">Chiều (C)</option>
                        </select>
                        <select value={range.lido} onChange={(e) => updateRangeItem(student.idbgd, range.id, 'lido', e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
                          <option>Do sức khỏe</option>
                          <option>Việc gia đình</option>
                          <option>Nghỉ có phép</option>
                          <option>Lí do khác</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="p-6 border-t bg-slate-50">
              <button onClick={submitAttendance} disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2">
                {loading ? "Đang xử lý dữ liệu..." : <><Send size={16}/> Xác nhận gửi Cloud</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
