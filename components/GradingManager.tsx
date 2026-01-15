
import React, { useState, useMemo } from 'react';
import { Save, ListChecks, CalendarRange, Settings2, UserPlus, Trash2, ShieldCheck, UserCircle2 } from 'lucide-react';

export const GradingManager = ({ state, setState }: any) => {
  const [mode, setMode] = useState<'week' | 'semester'>('week');
  const [tab, setTab] = useState<'auto' | 'manual' | 'config'>('auto');
  const [isSaving, setIsSaving] = useState(false);

  // Range Học Kỳ
  const [startWeek, setStartWeek] = useState(1);
  const [endWeek, setEndWeek] = useState(state.currentWeek);

  // Logic Xếp Loại Thủ Công Tạm Thời (Chỉ trong phiên làm việc hiện tại)
  const [localManualId, setLocalManualId] = useState('');
  const [localManualRank, setLocalManualRank] = useState('Tốt');

  const rulePoints: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    state.violations.forEach((v: any) => map[String(v.codeRule).toUpperCase()] = v.points);
    state.rewards.forEach((r: any) => map[String(r.codeRule).toUpperCase()] = r.points);
    return map;
  }, [state.violations, state.rewards]);

  const finalGrades = useMemo(() => {
    return state.students.map((student: any) => {
      let totalScore = 100;
      const sId = String(student.idhs).trim();

      const vRow = state.violationLogs.find((r: any) => String(r[1]).trim() === sId);
      if (vRow) vRow.slice(2).forEach((code: any) => {
        const c = String(code || "").trim().toUpperCase();
        if (c && rulePoints[c]) totalScore -= rulePoints[c];
      });

      const rRow = state.rewardLogs.find((r: any) => String(r[1]).trim() === sId);
      if (rRow) rRow.slice(2).forEach((code: any) => {
        const c = String(code || "").trim().toUpperCase();
        if (c && rulePoints[c]) totalScore += rulePoints[c];
      });

      // Kiểm tra xem có xếp loại thủ công không
      const manualEntry = state.manualRanks?.find((m: any) => m.idhs === sId);
      let rank = 'Chưa xếp loại';

      if (manualEntry) {
        rank = manualEntry.rank;
      } else {
        const { tot, kha, dat } = state.gradingThresholds || { tot: 100, kha: 90, dat: 80 };
        if (totalScore >= tot) rank = 'Tốt';
        else if (totalScore >= kha) rank = 'Khá';
        else if (totalScore >= dat) rank = 'Đạt';
        else rank = 'Chưa đạt';
      }

      return { ...student, totalScore, finalRank: rank, isManual: !!manualEntry };
    }).sort((a: any, b: any) => b.totalScore - a.totalScore);
  }, [state.students, state.violationLogs, state.rewardLogs, state.gradingThresholds, state.manualRanks, rulePoints]);

  const handleSave = async () => {
    const label = mode === 'week' ? `w${state.currentWeek}` : `HK_${startWeek}-${endWeek}`;
    if (!confirm(`Xác nhận lưu kết quả ${label} lên Google Sheet?`)) return;
    
    setIsSaving(true);
    try {
      if (state.googleScriptUrl) {
        await fetch(state.googleScriptUrl, {
          method: 'POST', 
          mode: 'no-cors',
          body: JSON.stringify({
            action: 'save_final_grading',
            week: label,
            results: finalGrades.map(s => ({ idhs: s.idhs, score: s.totalScore, rank: s.finalRank }))
          })
        });
        alert("✅ Đã lưu kết quả thành công!");
      }
    } catch (err) { alert("❌ Lỗi đồng bộ!"); } finally { setIsSaving(false); }
  };

  const addManualRank = () => {
    if (!localManualId) return alert("Thầy hãy chọn học sinh!");
    setState((prev: any) => {
      const filtered = (prev.manualRanks || []).filter((m: any) => m.idhs !== localManualId);
      return {
        ...prev,
        manualRanks: [...filtered, { idhs: localManualId, rank: localManualRank }]
      };
    });
    setLocalManualId('');
  };

  const removeManualRank = (id: string) => {
    setState((prev: any) => ({
      ...prev,
      manualRanks: (prev.manualRanks || []).filter((m: any) => m.idhs !== id)
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* TỔNG QUAN CHẾ ĐỘ */}
      <div className="flex bg-white p-2 rounded-[32px] shadow-sm border border-slate-100">
        <button onClick={() => setMode('week')} className={`flex-1 py-4 rounded-[26px] font-black text-sm transition-all ${mode === 'week' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>TUẦN {state.currentWeek}</button>
        <button onClick={() => setMode('semester')} className={`flex-1 py-4 rounded-[26px] font-black text-sm transition-all ${mode === 'semester' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>HỌC KỲ / TỔNG HỢP</button>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap gap-4">
        <button onClick={() => setTab('auto')} className={`flex-1 min-w-[150px] py-5 rounded-[24px] font-black text-xs flex items-center justify-center gap-3 border transition-all ${tab === 'auto' ? 'bg-white border-indigo-500 text-indigo-600 shadow-sm scale-[1.02]' : 'bg-slate-50 text-slate-400 border-transparent'}`}>
          <ListChecks size={20}/> BẢNG TỔNG HỢP
        </button>
        <button onClick={() => setTab('manual')} className={`flex-1 min-w-[150px] py-5 rounded-[24px] font-black text-xs flex items-center justify-center gap-3 border transition-all ${tab === 'manual' ? 'bg-white border-rose-500 text-rose-600 shadow-sm scale-[1.02]' : 'bg-slate-50 text-slate-400 border-transparent'}`}>
          <UserPlus size={20}/> XẾP LOẠI RIÊNG
        </button>
        <button onClick={() => setTab('config')} className={`flex-1 min-w-[150px] py-5 rounded-[24px] font-black text-xs flex items-center justify-center gap-3 border transition-all ${tab === 'config' ? 'bg-white border-slate-900 text-slate-900 shadow-sm scale-[1.02]' : 'bg-slate-50 text-slate-400 border-transparent'}`}>
          <Settings2 size={20}/> CÀI ĐẶT NGƯỠNG
        </button>
      </div>

      {/* VIEW HỌC KỲ RANGE */}
      {mode === 'semester' && (
        <div className="bg-white p-8 rounded-[40px] border border-indigo-100 flex flex-col md:flex-row items-center gap-8 shadow-sm">
           <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
              <CalendarRange size={28}/>
           </div>
           <div className="flex-1 grid grid-cols-2 gap-8 w-full">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Từ tuần</label>
                <input type="number" value={startWeek} onChange={(e) => setStartWeek(parseInt(e.target.value))} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-center outline-none focus:bg-white focus:ring-2 ring-indigo-500/20"/>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Đến tuần</label>
                <input type="number" value={endWeek} onChange={(e) => setEndWeek(parseInt(e.target.value))} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-center outline-none focus:bg-white focus:ring-2 ring-indigo-500/20"/>
              </div>
           </div>
        </div>
      )}

      {/* CẤU HÌNH NGƯỠNG ĐIỂM */}
      {tab === 'config' && (
        <div className="bg-white p-10 rounded-[40px] shadow-sm space-y-8 animate-in slide-in-from-top-4">
           <div className="flex items-center gap-4">
             <Settings2 className="text-slate-400" size={24}/>
             <h4 className="font-black text-slate-800 uppercase tracking-tight text-xl">Cài đặt mốc điểm danh hiệu</h4>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { key: 'tot', label: 'Tốt từ', color: 'text-emerald-500' },
                { key: 'kha', label: 'Khá từ', color: 'text-indigo-500' },
                { key: 'dat', label: 'Đạt từ', color: 'text-amber-500' },
                { key: 'chuaDat', label: 'Chưa đạt', color: 'text-rose-500' }
              ].map(item => (
                <div key={item.key} className="p-6 bg-slate-50 rounded-[32px] space-y-3 border border-slate-100">
                   <label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${item.color}`}>{item.label}</label>
                   <input 
                    type="number" 
                    value={state.gradingThresholds?.[item.key] || 0} 
                    onChange={(e) => setState((prev: any) => ({
                      ...prev, 
                      gradingThresholds: { ...prev.gradingThresholds, [item.key]: parseInt(e.target.value) }
                    }))}
                    className="w-full p-4 bg-white rounded-2xl font-black text-2xl text-center shadow-inner outline-none focus:ring-2 ring-indigo-500/20"
                   />
                </div>
              ))}
           </div>
        </div>
      )}

      {/* XẾP LOẠI RIÊNG (OVERRIDE) */}
      {tab === 'manual' && (
        <div className="bg-white p-10 rounded-[40px] shadow-sm space-y-10 animate-in slide-in-from-top-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Chọn học sinh</label>
                <select value={localManualId} onChange={(e) => setLocalManualId(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border border-slate-100">
                  <option value="">-- Click để chọn --</option>
                  {state.students.map((s: any) => <option key={s.idhs} value={s.idhs}>{s.stt}. {s.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Danh hiệu gán</label>
                <select value={localManualRank} onChange={(e) => setLocalManualRank(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border border-slate-100">
                  {['Tốt', 'Khá', 'Đạt', 'Chưa đạt', 'Không xếp loại'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button onClick={addManualRank} className="md:mt-6 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-xl shadow-rose-100 active:scale-95 transition-all py-5">
                <UserPlus size={18}/> THÊM VÀO DANH SÁCH
              </button>
           </div>
           
           <div className="space-y-3">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách ghi đè ({state.manualRanks?.length || 0})</h5>
              {(!state.manualRanks || state.manualRanks.length === 0) && <p className="text-slate-300 text-xs italic font-bold">Chưa có học sinh nào được gán riêng.</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {state.manualRanks?.map((item: any) => {
                  const s = state.students.find((std: any) => std.idhs === item.idhs);
                  return (
                    <div key={item.idhs} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl overflow-hidden shadow-sm">
                          {s?.avatarUrl ? <img src={s.avatarUrl} className="w-full h-full object-cover" /> : <UserCircle2 size={24} className="text-slate-200 m-auto"/>}
                        </div>
                        <span className="font-bold text-slate-700">{s?.name} ➔ <span className="text-rose-600 uppercase text-xs tracking-wider">{item.rank}</span></span>
                      </div>
                      <button onClick={() => removeManualRank(item.idhs)} className="text-slate-300 group-hover:text-rose-500 transition-all p-2"><Trash2 size={18}/></button>
                    </div>
                  )
                })}
              </div>
           </div>
        </div>
      )}

      {/* BẢNG ĐIỂM CHI TIẾT */}
      <div className="bg-white rounded-[45px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="p-8 font-black text-[10px] text-slate-400 uppercase text-left tracking-widest">Học sinh</th>
              <th className="p-8 font-black text-[10px] text-slate-400 uppercase text-center tracking-widest">Điểm thi đua</th>
              <th className="p-8 font-black text-[10px] text-slate-400 uppercase text-center tracking-widest">Xếp loại dự kiến</th>
            </tr>
          </thead>
          <tbody>
            {finalGrades.map((s: any) => (
              <tr key={s.idhs} className="border-b border-slate-50 last:border-none group hover:bg-slate-50/20 transition-all">
                <td className="p-6 px-8 flex items-center gap-5">
                  <div className="w-12 h-12 bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 group-hover:border-indigo-200">
                    {s.avatarUrl ? <img src={s.avatarUrl} className="w-full h-full object-cover" /> : <UserCircle2 size={24} className="text-slate-100 m-auto mt-3"/>}
                  </div>
                  <div>
                    <div className="font-black text-slate-800 uppercase text-sm tracking-tight">{s.stt}. {s.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold tracking-widest">{s.idhs}</div>
                  </div>
                </td>
                <td className="p-6 text-center">
                  <span className={`text-2xl font-black ${s.totalScore >= 100 ? 'text-emerald-500' : s.totalScore >= 80 ? 'text-indigo-600' : 'text-rose-500'}`}>
                    {s.totalScore}
                  </span>
                </td>
                <td className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase border tracking-[0.1em] ${
                      s.isManual ? 'border-rose-200 bg-rose-50 text-rose-600' : 
                      s.finalRank === 'Tốt' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' :
                      s.finalRank === 'Khá' ? 'border-indigo-200 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-400'
                    }`}>
                      {s.finalRank}
                    </span>
                    {s.isManual && <ShieldCheck size={14} className="text-rose-400" title="Đã ghi đè thủ công"/>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={handleSave} disabled={isSaving} className="w-full py-8 bg-slate-900 text-white rounded-[35px] font-black text-xl shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all group hover:bg-indigo-600">
        {isSaving ? (
          <div className="animate-pulse">ĐANG XỬ LÝ DỮ LIỆU...</div>
        ) : (
          <><Save size={32} className="group-hover:rotate-12 transition-transform"/> XUẤT KẾT QUẢ LÊN GOOGLE SHEET</>
        )}
      </button>
    </div>
  );
};
