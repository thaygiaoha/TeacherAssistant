import React, { useState } from 'react';
import { Send, X } from 'lucide-react';

export const AttendanceManager = ({ state }: any) => {
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingList, setPendingList] = useState<any[]>([]);

  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const handleUpdateStatus = (idbgd: string, status: string) => {
    setAttendance(prev => ({ ...prev, [idbgd]: status }));
  };

  // BƯỚC 1: LỌC DANH SÁCH VẮNG VÀ CHUẨN BỊ DỮ LIỆU
  const prepareAttendance = () => {
    const list = state.students
      .map((s: any) => {
        const currentStatus = attendance[s.idbgd];
        // Chỉ xử lý nếu trạng thái là P hoặc KP
        if (currentStatus === 'P' || currentStatus === 'K') {
          return {
            stt: s.stt,
            idbgd: s.idbgd,
            name: s.name,
            class: s.class, // Thêm lớp để gửi lên cột B
            date: s.date,   // Ngày sinh để gửi lên cột E
            type: currentStatus, // P hoặc K (Gửi lên cột J)
            dd: String(today.getDate()).padStart(2, '0'),
            mm: String(today.getMonth() + 1).padStart(2, '0'),
            yyyy: String(today.getFullYear()),
            break: 'N',
            lido: 'Do sức khỏe'
          };
        }
        return null;
      })
      .filter((item: any) => item !== null);

    if (list.length === 0) return alert("Chưa chọn học sinh vắng nào!");
    setPendingList(list);
    setShowModal(true);
  };

  const updatePendingItem = (idbgd: string, field: string, value: string) => {
    setPendingList(prev => prev.map(item => 
      item.idbgd === idbgd ? { ...item, [field]: value } : item
    ));
  };

  // BƯỚC 2: GỬI LÊN CLOUD
  const submitAttendance = async () => {
    if (!state.googleScriptUrl) return alert("Chưa có link Script!");
    setLoading(true);
    try {
      await fetch(state.googleScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          action: 'save_attendance_batch',
          payload: pendingList
        })
      });
      
      alert(`✅ Đã lưu ${pendingList.length} học sinh vắng!`);
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
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Điểm danh</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Ngày {dateStr}</p>
        </div>
        <button 
          onClick={prepareAttendance}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg text-xs uppercase tracking-widest"
        >
          <Send size={18}/> Tiếp tục ({state.students.filter((s:any) => attendance[s.idbgd] === 'P' || attendance[s.idbgd] === 'KP').length})
        </button>
      </div>

      {/* Danh sách học sinh */}
      <div className="grid grid-cols-1 gap-3">
        {state.students.map((s: any) => (
          <div key={s.idbgd} className="bg-white p-4 rounded-[30px] border border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs">{s.stt}</div>
              <div>
                <span className="font-black text-slate-700 uppercase text-sm block">{s.name}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">{s.idbgd}</span>
              </div>
            </div>
            
            <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl">
              {[
                { id: 'OK', label: 'CÓ MẶT', color: 'bg-emerald-500' },
                { id: 'P', label: 'P', color: 'bg-amber-500' },
                { id: 'KP', label: 'KP', color: 'bg-rose-500' }
              ].map((btn) => {
                const isSelected = attendance[s.idbgd] === btn.id || (!attendance[s.idbgd] && btn.id === 'OK');
                return (
                  <button
                    key={btn.id}
                    onClick={() => handleUpdateStatus(s.idbgd, btn.id)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                      isSelected ? `${btn.color} text-white shadow-md` : 'text-slate-300'
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

      {/* MODAL CHI TIẾT VẮNG */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 uppercase tracking-tight">Chi tiết vắng</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X/></button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-4 bg-white">
              {pendingList.map((item) => (
                <div key={item.idbgd} className="p-5 rounded-[30px] border border-slate-100 bg-slate-50/50 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-800 uppercase text-sm">{item.name}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black text-white ${item.type === 'P' ? 'bg-amber-500' : 'bg-rose-500'}`}>
                      {item.type === 'P' ? 'CÓ PHÉP' : 'K.PHÉP'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input 
                      type="date" 
                      defaultValue={`${item.yyyy}-${item.mm}-${item.dd}`}
                      onChange={(e) => {
                        const [y, m, d] = e.target.value.split('-');
                        updatePendingItem(item.idbgd, 'dd', d);
                        updatePendingItem(item.idbgd, 'mm', m);
                        updatePendingItem(item.idbgd, 'yyyy', y);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select 
                      value={item.break}
                      onChange={(e) => updatePendingItem(item.idbgd, 'break', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                    >
                      <option value="N">Cả ngày (N)</option>
                      <option value="S">Sáng (S)</option>
                      <option value="C">Chiều (C)</option>
                    </select>
                    <select 
                      value={item.lido}
                      onChange={(e) => updatePendingItem(item.idbgd, 'lido', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                    >
                      <option>Do sức khỏe</option>
                      <option>Việc gia đình</option>
                      <option>Do ốm đau</option>
                      <option>Do đi khám bệnh</option>
                      <option>Do đi du lịch</option>
                      <option>Lí do khác</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t">
              <button 
                onClick={submitAttendance}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 active:scale-[0.98] transition-all"
              >
                {loading ? "Đang gửi dữ liệu..." : "Xác nhận gửi lên Cloud"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
