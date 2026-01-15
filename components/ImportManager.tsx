import React, { useState } from 'react';
import { 
  FileUp, CloudUpload, Loader2, PlusCircle, RefreshCw, UserPlus 
} from 'lucide-react';
import { Student, RelativeInfo } from '../types';

declare const XLSX: any;

export const ImportManager = ({ state, setState }: any) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualIdhs, setManualIdhs] = useState('');
  const [manualStt, setManualStt] = useState('');

  // Hàm kiểm tra mật khẩu dùng chung
  const checkPermission = () => {
    const pwd = prompt("Nhập mật khẩu xác nhận:");
    if (pwd !== state.appPassword) {
      alert("❌ Mật khẩu không đúng!");
      return false;
    }
    return true;
  };

  const fetchCloudData = async () => {
    if (!checkPermission()) return; // Thêm bảo mật
    if (!state.googleScriptUrl) return alert("❌ Thầy chưa cấu hình Link Script!");
    setIsProcessing(true);
    try {
      const response = await fetch(`${state.googleScriptUrl}?action=get_initial_data`);
      const data = await response.json();
      if (data) {
        setState((prev: any) => ({ ...prev, ...data }));
        alert("✅ Đã đồng bộ dữ liệu mới nhất từ Google Sheet!");
      }
    } catch (error) {
      alert("❌ Lỗi kết nối. Vui lòng kiểm tra lại Script!");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualAdd = async () => {
    if (!manualName || !manualIdhs) return alert("❌ Thầy vui lòng nhập đủ Tên và Mã HS!");
    if (!checkPermission()) return; // Thêm bảo mật
    if (!state.googleScriptUrl) return alert("❌ Thầy chưa cấu hình Link Script!");

    setIsProcessing(true);
    try {
      const newStudent = { name: manualName, idhs: manualIdhs, stt: manualStt };
      await fetch(state.googleScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'add_single_student', payload: newStudent })
      });

      setState((prev: any) => {
        const newStudents = [...prev.students];
        const studentObj = {
          stt: manualStt ? parseInt(manualStt) : prev.students.length + 1,
          name: manualName,
          idhs: manualIdhs,
          idbgd: manualIdbgd,
          class: '', date: '', gender: 'Nam', phoneNumber: '', accommodation: '', cccd: ''
        };
        if (manualStt) {
          const idx = parseInt(manualStt) - 1;
          newStudents.splice(idx, 0, studentObj);
          return { ...prev, students: newStudents.map((s, i) => ({ ...s, stt: i + 1 })) };
        } else {
          return { ...prev, students: [...newStudents, studentObj] };
        }
      });

      setManualName(''); setManualIdhs(''); setManualStt('');
      alert(`✅ Đã chèn học sinh ${manualName} thành công!`);
    } catch (err) {
      alert("❌ Lỗi khi gửi dữ liệu!");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFile = (e: any) => {
    if (!checkPermission()) { // Thêm bảo mật
      e.target.value = null;
      return;
    }
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event: any) => {
      try {
        const data = new Uint8Array(event.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const dsSheet = wb.Sheets['danhsach'];
        if (!dsSheet) throw new Error("Không thấy sheet 'danhsach'!");
        
        const students: Student[] = XLSX.utils.sheet_to_json(dsSheet).map((r: any) => ({
          stt: Number(r.stt || 0),
          name: r.name || '',
          class: r.class || '',
          date: r.date || '',
          gender: r.gender || 'Nam',
          phoneNumber: String(r.phoneNumber || ''),
          accommodation: r.accommodation || '',
          cccd: String(r.cccd || ''),
          idhs: String(r.idhs || ''),
          idbgd: String(r.idbgd || '')
        }));

        const ntSheet = wb.Sheets['nguoithan'];
        const relatives: RelativeInfo[] = ntSheet ? XLSX.utils.sheet_to_json(ntSheet).map((r: any) => ({
          idhs: String(r.idhs || ''),
          namefather: r.namefather || '',
          phonefather: String(r.phonefather || ''),
          datefather: r.datefather || '',
          jobfather: r.jobfather || '',
          namemother: r.namemother || '',
          phonemother: String(r.phonemother || ''),
          datemother: r.datemother || '',
          jobmother: r.jobmother || '',
          hoancanh: r.hoancanh || ''
        })) : [];

        if (state.googleScriptUrl) {
          await fetch(state.googleScriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ action: 'sync_all_master', payload: { students, relatives } })
          });
        }
        setState((prev: any) => ({ ...prev, students, relatives }));
        alert("✅ Đã đồng bộ dữ liệu Excel thành công!");
      } catch (err: any) {
        alert("❌ Lỗi Import: " + err.message);
      } finally {
        setIsProcessing(false);
        e.target.value = null;
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-10">
      {/* KHỐI TRÊN: NHẬP LẺ & ĐỒNG BỘ CLOUD - Đã xóa phần trùng lặp */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center"><UserPlus size={24} /></div>
            <div className="text-left">
              <h3 className="text-xl font-black text-slate-800 uppercase">Thêm học sinh mới</h3>
              <p className="text-xs text-slate-400 font-bold uppercase">Nhập lẻ & Chèn vị trí</p>
            </div>
          </div>
          <div className="space-y-4 flex-1">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">STT</label>
                <input type="number" placeholder="VD: 5" value={manualStt} onChange={(e) => setManualStt(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none font-bold text-center" />
              </div>
              <div className="col-span-2 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Họ và tên</label>
                <input type="text" placeholder="Nguyễn Văn An" value={manualName} onChange={(e) => setManualName(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none font-bold" />
              </div>
            </div>
            <div className="text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Mã học sinh (IDHS)</label>
              <input type="text" placeholder="HS202401" value={manualIdhs} onChange={(e) => setManualIdhs(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none font-bold" />
            </div>
          </div>
          <button onClick={handleManualAdd} className="mt-8 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm flex items-center justify-center gap-3"><PlusCircle size={20} /> XÁC NHẬN CHÈN</button>
        </div>

        <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center"><RefreshCw size={24} /></div>
            <div className="text-left">
              <h3 className="text-xl font-black text-slate-800 uppercase">Đồng bộ Cloud</h3>
              <p className="text-xs text-slate-400 font-bold uppercase">Cập nhật dữ liệu từ Google</p>
            </div>
          </div>
          <div className="bg-emerald-50/50 p-6 rounded-[32px] border border-emerald-100 mb-8 flex-1">
             <p className="text-sm text-emerald-800 font-bold leading-relaxed italic text-left">"Hệ thống sẽ tải lại toàn bộ danh sách, quy tắc và tin tức mới nhất từ Google Sheet."</p>
          </div>
          <button onClick={fetchCloudData} className="py-5 bg-emerald-600 text-white rounded-[24px] font-black text-sm flex items-center justify-center gap-3 uppercase"><RefreshCw size={20} className={isProcessing ? "animate-spin" : ""} /> Tải lại dữ liệu</button>
        </div>
      </div>

      {/* KHỐI DƯỚI: IMPORT EXCEL - Đã dọn dẹp phần thừa */}
      <div className="bg-white p-16 rounded-[64px] shadow-sm border border-slate-100 text-center relative overflow-hidden group">
        <div className="relative z-10">
          <div className="w-24 h-24 bg-slate-900 rounded-[36px] flex items-center justify-center mx-auto mb-10 text-white shadow-2xl group-hover:bg-indigo-600 transition-all duration-500"><FileUp size={48} /></div>
          <h2 className="text-4xl font-black text-slate-900 uppercase mb-4">Thay thế bằng file Excel</h2>
          <div className="relative inline-block">
            <input type="file" accept=".xlsx, .xls" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
            <div className="bg-slate-900 text-white py-6 px-12 rounded-[32px] font-black text-lg inline-flex items-center gap-4 hover:bg-indigo-600 transition-all shadow-2xl"><CloudUpload size={24} /> CHỌN TỆP EXCEL MỚI</div>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[200]">
           <div className="bg-white px-10 py-8 rounded-[40px] shadow-2xl flex items-center gap-5 font-black text-indigo-600 animate-bounce"><Loader2 className="animate-spin" size={32} /> ĐANG XỬ LÝ...</div>
        </div>
      )}
    </div>
  );
};
