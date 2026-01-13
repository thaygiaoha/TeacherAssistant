import React, { useState } from 'react';
import { FileUp, CloudUpload, UserPlus, RefreshCw, Loader2, Database } from 'lucide-react';

declare const XLSX: any;

export const ImportManager = ({ state, setState }: any) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', class: '', idhs: '' });

  // --- 1. HÀM IMPORT EXCEL (THAY THẾ HOÀN TOÀN CẢ 2 SHEET) ---
  const handleFile = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = async (event: any) => {
      try {
        const data = new Uint8Array(event.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        
        // Đọc sheet danhsach
        const dsSheet = wb.Sheets['danhsach'];
        if (!dsSheet) throw new Error("Không thấy sheet danhsach");
        const students = XLSX.utils.sheet_to_json(dsSheet).map((r: any) => ({
          stt: r.stt || '', name: r.name || '', class: r.class || '', date: r.date || '',
          gender: r.gender || '', phoneNumber: r.phoneNumber || '', accommodation: r.accommodation || '',
          cccd: r.cccd || '', idhs: String(r.idhs || '')
        }));

        // Đọc sheet nguoithan
        const ntSheet = wb.Sheets['nguoithan'];
        const relatives = ntSheet ? XLSX.utils.sheet_to_json(ntSheet).map((r: any) => ({
          idhs: String(r.idhs || ''),
          phonefather: r.phonefather || '', datefather: r.datefather || '', jobfather: r.jobfather || '',
          fonemother: r.fonemother || '', datemother: r.datemother || '', jobmother: r.jobmother || '',
          hoancanh: r.hoancanh || ''
        })) : [];

        // Cập nhật Local State
        setState((prev: any) => ({ ...prev, students, relatives }));

        // Gửi lên Google (Đồng bộ cả 2 mảng)
        if (state.googleScriptUrl) {
          await fetch(state.googleScriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ 
              action: 'sync_all', 
              payload: { students, relatives } 
            })
          });
        }
        alert("✅ Đã thay thế và đồng bộ dữ liệu (Danh sách & Người thân)!");
      } catch (err: any) {
        alert("❌ Lỗi: " + err.message);
      } finally {
        setIsProcessing(false);
        e.target.value = null;
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // --- 2. HÀM NHẬP TAY (GIỮ NGUYÊN NGƯỜI THÂN CŨ) ---
  const handleAddManual = async () => {
    if (!newStudent.name || !newStudent.idhs) return alert("Vui lòng nhập tên và mã HS!");
    
    setIsProcessing(true);
    const updatedStudents = [...state.students, { 
        ...newStudent, 
        stt: state.students.length + 1,
        date: '', gender: 'Nam', phoneNumber: '', accommodation: '', cccd: ''
    }];

    // Khi nhập tay, ta gửi kèm state.relatives hiện tại để không bị mất dữ liệu ở sheet nguoithan
    setState((prev: any) => ({ ...prev, students: updatedStudents }));

    if (state.googleScriptUrl) {
      try {
        await fetch(state.googleScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ 
            action: 'sync_all', 
            payload: { 
                students: updatedStudents, 
                relatives: state.relatives // Giữ nguyên danh sách người thân hiện có
            } 
          })
        });
      } catch (e) {
        console.error("Lỗi đồng bộ:", e);
      }
    }
    setNewStudent({ name: '', class: '', idhs: '' });
    setIsProcessing(false);
    alert("✅ Đã thêm học sinh mới!");
  };

  // --- 3. ĐỒNG BỘ NGƯỢC (PULL) ---
  const handlePullData = async () => {
    if (!state.googleScriptUrl) return alert("❌ Thầy chưa cài đặt Link Script!");
    
    setIsProcessing(true);
    try {
      // Gọi lệnh pull từ Google
      const response = await fetch(`${state.googleScriptUrl}?action=pull_students`);
      const result = await response.json();

      if (result && result.students) {
        // Cập nhật lại toàn bộ danh sách từ Google về App
        setState((prev: any) => ({
          ...prev,
          students: result.students,
          relatives: result.relatives || []
        }));
        
        alert(`✅ Đã đồng bộ thành công ${result.students.length} học sinh từ Google Sheet!`);
      } else {
        alert("⚠️ Không tìm thấy dữ liệu hợp lệ trên Google Sheet.");
      }
    } catch (error) {
      console.error("Lỗi Pull:", error);
      alert("❌ Lỗi kết nối với Google Sheet. Thầy kiểm tra lại link Script nhé!");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      {/* Giao diện Nhập tay */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <UserPlus className="text-indigo-500" size={24} /> Thêm học sinh mới
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input 
            placeholder="Họ và tên" 
            value={newStudent.name}
            onChange={e => setNewStudent({...newStudent, name: e.target.value})}
            className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 ring-indigo-500 font-bold"
          />
          <input 
            placeholder="Lớp" 
            value={newStudent.class}
            onChange={e => setNewStudent({...newStudent, class: e.target.value})}
            className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 ring-indigo-500 font-bold"
          />
          <input 
            placeholder="Mã số HS" 
            value={newStudent.idhs}
            onChange={e => setNewStudent({...newStudent, idhs: e.target.value})}
            className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 ring-indigo-500 font-bold"
          />
          <button 
            onClick={handleAddManual}
            className="bg-indigo-600 text-white font-black rounded-2xl hover:bg-slate-900 transition-all shadow-lg"
          >
            XÁC NHẬN THÊM
          </button>
        </div>
      </div>

      {/* Giao diện Import/Pull */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group text-center">
          <input type="file" accept=".xlsx, .xls" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 group-hover:scale-110 transition-all">
            <CloudUpload size={32} />
          </div>
          <h4 className="font-black text-slate-800 uppercase text-sm">Ghi đè bằng file Excel</h4>
          <p className="text-[11px] text-slate-400 font-bold mt-1">Cập nhật lại toàn bộ danh sách & người thân</p>
        </div>

        <button 
          onClick={handlePullData}
          className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center justify-center hover:bg-slate-50 transition-all group"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 text-emerald-600 group-hover:rotate-180 transition-all duration-700">
            <RefreshCw size={32} />
          </div>
          <h4 className="font-black text-slate-800 uppercase text-sm">Đồng bộ từ Google</h4>
          <p className="text-[11px] text-slate-400 font-bold mt-1">Lấy dữ liệu mới nhất từ Sheet về App</p>
        </button>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100]">
           <div className="bg-white px-8 py-6 rounded-[32px] shadow-2xl flex items-center gap-4 font-black text-indigo-600 animate-bounce">
              <Loader2 className="animate-spin" /> ĐANG ĐỒNG BỘ...
           </div>
        </div>
      )}
    </div>
  );
};
