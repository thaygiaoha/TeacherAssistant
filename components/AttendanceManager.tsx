import React, { useState } from 'react';
import { Send, X } from 'lucide-react';

export const AttendanceManager = ({ state }: any) => {
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]); 

  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const handleUpdateStatus = (idbgd: string, status: string) => {
    setAttendance(prev => ({ ...prev, [idbgd]: status }));
  };
   2. Hàm để đóng/mở ô nhập ngày cho từng học sinh
const toggleRange = (id: string) => {
  setExpandedIds(prev => 
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  );
};
  const prepareAttendance = () => {
    const list = state.students
      .map((s: any) => {
        const currentStatus = attendance[s.idbgd];
        if (currentStatus === 'P' || currentStatus === 'KP') {
          
          // FIX TRIỆT ĐỂ LỖI DATE: 
          // Nếu s.date là đối tượng Date, ta ép nó về chuỗi dd/mm/yyyy ngay lập tức
          let cleanBirthDate = "";
          if (s.date) {
            const d = new Date(s.date);
            // Kiểm tra xem có phải ngày hợp lệ không, nếu không thì lấy nguyên văn chuỗi
            cleanBirthDate = isNaN(d.getTime()) 
              ? String(s.date).split('T')[0] 
              : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
          }

          return {
            stt: s.stt,
            idbgd: s.idbgd,
            name: s.name,
            class: s.class,
            date: cleanBirthDate, // Đã được dọn dẹp sạch sẽ thành dd/mm/yyyy
            displayType: currentStatus, // Dùng để hiện trên giao diện (P/KP)
            type: currentStatus === 'KP' ? 'K' : currentStatus, // Dùng để gửi lên Sheet (P/K)
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

const getDatesInRange = (startDateStr, endDateStr) => {
  const dates = [];
  let curr = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  // Vòng lặp lấy đủ tất cả các ngày (bao gồm cả T7, CN nếu dính trong khoảng)
  while (curr <= end) {
    dates.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};
  const submitAttendance = async () => {
  if (!state.googleScriptUrl) return alert("Chưa có link Script!");
  setLoading(true);
  
  let finalBatch = []; // Mảng chứa tất cả các dòng sẽ ghi xuống Sheet
  
  pendingList.forEach(item => {
    // 1. Tạo chuỗi ngày bắt đầu từ dữ liệu của học sinh
    const startDateStr = `${item.yyyy}-${item.mm}-${item.dd}`;
    
    // 2. Lấy ngày kết thúc (nếu thầy không chọn "Đến ngày", nó lấy luôn ngày bắt đầu)
    const endDateStr = item.endDate || startDateStr; 
    
    // 3. Gọi hàm tính toán danh sách các ngày
    const range = getDatesInRange(startDateStr, endDateStr);
    
    // 4. Với mỗi ngày trong khoảng, tạo ra một dòng dữ liệu mới
    range.forEach(d => {
      finalBatch.push({
        ...item,
        dd: String(d.getDate()).padStart(2, '0'),
        mm: String(d.getMonth() + 1).padStart(2, '0'),
        yyyy: String(d.getFullYear()),
      });
    });
  });

  if (finalBatch.length === 0) {
    setLoading(false);
    return alert("Chưa có dữ liệu ngày hợp lệ!");
  }

  try {
    await fetch(state.googleScriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        action: 'save_attendance_batch',
        payload: finalBatch
      })
    });
    alert(`✅ Thành công! Đã ghi ${finalBatch.length} lượt nghỉ xuống Sheet.`);
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
      <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Điểm danh</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Ngày {dateStr}</p>
        </div>
        <button 
          onClick={prepareAttendance}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg text-xs uppercase tracking-widest"
        >
          Tiếp tục ({state.students.filter((s:any) => attendance[s.idbgd] === 'P' || attendance[s.idbgd] === 'KP').length})
        </button>
      </div>

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
              {['OK', 'P', 'KP'].map((id) => {
                const isSelected = attendance[s.idbgd] === id || (!attendance[s.idbgd] && id === 'OK');
                return (
                  <button
                    key={id}
                    onClick={() => handleUpdateStatus(s.idbgd, id)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                      isSelected ? (id === 'OK' ? 'bg-emerald-500 text-white' : id === 'P' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white') : 'text-slate-300'
                    }`}
                  >
                    {id === 'OK' ? 'CÓ MẶT' : id}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 uppercase tracking-tight">Chi tiết vắng</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400"><X/></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4 bg-white">
              {pendingList.map((item) => {
  // Kiểm tra xem học sinh này có đang được chọn nghỉ dài ngày không (dùng state expandedIds đã khai báo ở đầu)
  const isRange = expandedIds.includes(item.idbgd);

  return (
    <div key={item.idbgd} className="p-5 rounded-[30px] border border-slate-100 bg-slate-50/50 space-y-4">
      {/* PHẦN ĐẦU: Tên học sinh và Nút mở rộng */}
      <div className="flex justify-between items-center">
        <div>
          <span className="font-black text-slate-800 uppercase text-sm block">{item.name}</span>
          <span className="text-[9px] text-slate-500 font-bold italic">Mã số: {item.idbgd}</span>
        </div>
        
        <button 
          type="button"
          onClick={() => toggleRange(item.idbgd)}
          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${
            isRange ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
          }`}
        >
          {isRange ? "✕ Hủy nghỉ dài" : "+ Thêm ngày nghỉ"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* HÀNG 1: Chọn ngày (Tự động chuyển 1 cột hoặc 2 cột) */}
        <div className={`grid ${isRange ? 'grid-cols-2' : 'grid-cols-1'} gap-3 transition-all`}>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">
              {isRange ? "Từ ngày" : "Ngày vắng"}
            </label>
            <input type="date" 
              defaultValue={`${item.yyyy}-${item.mm}-${item.dd}`} 
              onChange={(e) => {
                const [y, m, d] = e.target.value.split('-');
                updatePendingItem(item.idbgd, 'dd', d); 
                updatePendingItem(item.idbgd, 'mm', m); 
                updatePendingItem(item.idbgd, 'yyyy', y);
              }} 
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold shadow-sm" 
            />
          </div>

          {isRange && (
            <div className="space-y-1 animate-in fade-in slide-in-from-left-2">
              <label className="text-[9px] font-black uppercase text-rose-400 ml-2">Đến ngày</label>
              <input type="date" 
                defaultValue={`${item.yyyy}-${item.mm}-${item.dd}`} 
                onChange={(e) => updatePendingItem(item.idbgd, 'endDate', e.target.value)}
                className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs font-bold shadow-sm" 
              />
            </div>
          )}
        </div>

        {/* HÀNG 2: Chọn Buổi nghỉ và Lý do (Đây là phần thầy chót xóa đây ạ) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Buổi nghỉ</label>
            <select 
              value={item.break} 
              onChange={(e) => updatePendingItem(item.idbgd, 'break', e.target.value)} 
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold shadow-sm"
            >
              <option value="N">Cả ngày (N)</option>
              <option value="S">Buổi Sáng (S)</option>
              <option value="C">Buổi Chiều (C)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Lý do nghỉ</label>
            <select 
              value={item.lido} 
              onChange={(e) => updatePendingItem(item.idbgd, 'lido', e.target.value)} 
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold shadow-sm"
            >
              <option>Do sức khỏe</option>
              <option>Việc gia đình</option>
              <option>Ốm đau/Nằm viện</option>
              <option>Lý do khác</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
})}
        </div>

        {/* Hàng 2: Buổi nghỉ và Lý do */}
        <div className="grid grid-cols-2 gap-3">
          <select value={item.break} onChange={(e) => updatePendingItem(item.idbgd, 'break', e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
            <option value="N">Cả ngày</option>
            <option value="S">Buổi Sáng</option>
            <option value="C">Buổi Chiều</option>
          </select>
          <select value={item.lido} onChange={(e) => updatePendingItem(item.idbgd, 'lido', e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
            <option>Do sức khỏe</option>
            <option>Việc gia đình</option>
            <option>Nghỉ có phép</option>
            <option>Lí do khác</option>
          </select>
        </div>
      </div>
    </div>
  );
})}
            </div>
            <div className="p-6 border-t bg-slate-50">
              <button onClick={submitAttendance} disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">
                {loading ? "Đang gửi..." : "Xác nhận gửi Cloud"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
       
       
