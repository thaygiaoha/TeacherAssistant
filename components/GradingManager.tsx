import React, { useState, useMemo } from 'react';
import { Calculator, Trophy, UserPlus, Trash2, Save, AlertTriangle, Calendar, Star, ChevronRight } from 'lucide-react';

export const GradingManager = ({ state, setState }: any) => {
  const [mode, setMode] = useState<'week' | 'semester' | 'year'>('week');
  const [subMode, setSubMode] = useState('HK1'); 
  const [range, setRange] = useState({ from: 1, to: 18 }); 
  const [isCalculating, setIsCalculating] = useState(false);
  
  const [quota, setQuota] = useState({ tot: 40, kha: 5, dat: 0, chuadat: 0 });
  const [exceptions, setExceptions] = useState<{idhs: string, rank: string}[]>([]);
  const [selectedExStudent, setSelectedExStudent] = useState('');
  const [selectedExRank, setSelectedExRank] = useState('Chưa Đạt');

  const finalGrades = useMemo(() => {
    // 1. Bản đồ điểm
    const scoreMap: Record<string, number> = {};
    state.violations.forEach((v: any) => scoreMap[String(v.codeRule).toUpperCase()] = -Math.abs(v.points || 0));
    state.rewards.forEach((r: any) => scoreMap[String(r.codeRule).toUpperCase()] = Math.abs(r.points || 0));
    state.bch.forEach((b: any) => scoreMap[String(b.codeRule).toUpperCase()] = Math.abs(b.points || 0));

    // 2. Bảng quy tắc Cả năm (T-T=T, T-K=K...)
    const yearRule: Record<string, string> = {
      'Tốt-Tốt': 'Tốt', 'Tốt-Khá': 'Khá', 'Khá-Tốt': 'Khá', 'Khá-Khá': 'Khá',
      'Tốt-Đạt': 'Đạt', 'Khá-Đạt': 'Đạt', 'Đạt-Khá': 'Đạt', 'Đạt-Đạt': 'Đạt',
      'Tốt-Chưa Đạt': 'Chưa Đạt', 'Chưa Đạt-Tốt': 'Chưa Đạt'
    };

    let list = state.students.map((student: any) => {
      let totalScore = 0;
      let autoRank = 'Không XL';

      if (mode === 'week') {
        totalScore = 100;
        // Quét ngang vipham
        const vRow = state.violationLogs?.find((r: any) => String(r.idhs || r[1]) === String(student.idhs));
        if (vRow) Object.values(vRow).forEach(val => {
          const code = String(val).trim().toUpperCase();
          if (scoreMap[code]) totalScore += scoreMap[code];
        });
        // Quét ngang thuong
        const rRow = state.rewardLogs?.find((r: any) => String(r.idhs || r[1]) === String(student.idhs));
        if (rRow) Object.values(rRow).forEach(val => {
          const code = String(val).trim().toUpperCase();
          if (scoreMap[code]) totalScore += scoreMap[code];
        });

      } else if (mode === 'semester') {
        // Cộng dồn các cột wX trong khoảng range
        const sRow = state.weeklyScores?.find((r: any) => String(r.idhs || r[1]) === String(student.idhs));
        if (sRow) {
          for (let w = range.from; w <= range.to; w++) {
            totalScore += Number(sRow[`w${w}`] || 0);
          }
        }
      } else if (mode === 'year') {
        // Lấy xếp loại từ sheet xeploai (đã load vào state)
        const xRow = state.allRanks?.find((r: any) => String(r.idhs || r[1]) === String(student.idhs)) || {};
        const hk1 = xRow['HK1'] || 'Không XL';
        const hk2 = xRow['HK2'] || 'Không XL';
        autoRank = yearRule[`${hk1}-${hk2}`] || (hk2 !== 'Không XL' ? hk2 : 'Không XL');
      }

      return { ...student, totalScore, autoRank };
    });

    // Xử lý Xếp hạng & Quota (Chỉ cho Tuần và Học kỳ)
    if (mode !== 'year') {
      list.sort((a, b) => b.totalScore - a.totalScore);
      let currentIdx = 0;
      const ranked = list.map(s => ({ ...s, autoRank: 'Không XL' }));
      
      const apply = (rankName: string, targetCount: number) => {
        let count = Number(targetCount);
        if (count <= 0 || currentIdx >= ranked.length) return;
        let lastIdx = Math.min(currentIdx + count - 1, ranked.length - 1);
        const threshold = ranked[lastIdx].totalScore;
        for (let i = currentIdx; i < ranked.length; i++) {
          if (i <= lastIdx || ranked[i].totalScore === threshold) {
            ranked[i].autoRank = rankName;
            currentIdx = i + 1;
          } else break;
        }
      };

      apply('Tốt', quota.tot);
      apply('Khá', quota.kha);
      apply('Đạt', quota.dat);
      apply('Chưa Đạt', quota.chuadat);
      list = ranked;
    }

    // Áp dụng Ngoại lệ
    return list.map(s => {
      const ex = exceptions.find(e => e.idhs === s.idhs);
      return { ...s, finalRank: ex ? ex.rank : s.autoRank, isManual: !!ex };
    });
  }, [state, mode, subMode, range, quota, exceptions]);

  const handleSave = async () => {
    const label = mode === 'week' ? `w${state.currentWeek}` : (mode === 'year' ? 'CN' : subMode);
    if (!window.confirm(`Lưu kết quả cho [${label}]?`)) return;
    setIsCalculating(true);
    try {
      await fetch(state.googleScriptUrl, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify({
          action: 'save_final_grading',
          week: label,
          results: finalGrades.map(s => ({ idhs: s.idhs, score: s.totalScore, rank: s.finalRank }))
        })
      });
      alert("✅ Đã lưu thành công!");
    } catch (err) { alert("❌ Lỗi!"); }
    finally { setIsCalculating(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 p-4">
      {/* MENU CHẾ ĐỘ */}
      <div className="flex bg-white p-2 rounded-[30px] shadow-sm border border-slate-100">
        {(['week', 'semester', 'year'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} className={`flex-1 py-4 rounded-[25px] font-black transition-all ${mode === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
            {m === 'week' ? 'TUẦN' : m === 'semester' ? 'HỌC KỲ' : 'CẢ NĂM'}
          </button>
        ))}
      </div>

      {/* CÀI ĐẶT NHANH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <h4 className="font-black text-slate-800 flex items-center gap-2 mb-6 uppercase text-xs tracking-widest"><Calendar size={16}/> Thời gian</h4>
          {mode === 'semester' ? (
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl">
              <select value={subMode} onChange={e => setSubMode(e.target.value)} className="bg-transparent font-bold outline-none border-r pr-4">
                <option value="HK1">HK1</option><option value="HK2">HK2</option>
              </select>
              <div className="flex items-center gap-2 flex-1 justify-center">
                <input type="number" value={range.from} onChange={e => setRange({...range, from: Number(e.target.value)})} className="w-12 text-center bg-white rounded-lg font-black" />
                <ChevronRight size={14}/>
                <input type="number" value={range.to} onChange={e => setRange({...range, to: Number(e.target.value)})} className="w-12 text-center bg-white rounded-lg font-black" />
              </div>
            </div>
          ) : <div className="p-4 bg-slate-50 rounded-3xl font-bold text-slate-500">{mode === 'week' ? `Đang xét Tuần ${state.currentWeek}` : 'Tính theo quy tắc HK1 + HK2'}</div>}
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <h4 className="font-black text-slate-800 flex items-center gap-2 mb-6 uppercase text-xs tracking-widest"><Star size={16}/> Chỉ tiêu (Chỉ tuần/HK)</h4>
          <div className="grid grid-cols-4 gap-2">
            {['tot', 'kha', 'dat', 'chuadat'].map(k => (
              <div key={k} className="text-center">
                <div className="text-[8px] font-black text-slate-300 uppercase">{k}</div>
                <input disabled={mode==='year'} type="number" value={(quota as any)[k]} onChange={e => setQuota({...quota, [k]: e.target.value})} className="w-full bg-slate-50 p-2 rounded-xl text-center font-black text-sm disabled:opacity-30" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NGOẠI LỆ */}
      <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl">
        <div className="flex flex-wrap gap-4 items-center">
          <select value={selectedExStudent} onChange={e => setSelectedExStudent(e.target.value)} className="flex-1 min-w-[200px] p-4 bg-slate-800 rounded-2xl font-bold outline-none border-none">
            <option value="">Chọn học sinh đặc biệt...</option>
            {state.students.map((s:any) => <option key={s.idhs} value={s.idhs}>{s.name}</option>)}
          </select>
          <select value={selectedExRank} onChange={e => setSelectedExRank(e.target.value)} className="w-32 p-4 bg-slate-800 rounded-2xl font-bold outline-none border-none">
            {['Tốt', 'Khá', 'Đạt', 'Chưa Đạt'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={() => { if(selectedExStudent) setExceptions([...exceptions, {idhs: selectedExStudent, rank: selectedExRank}]); setSelectedExStudent(''); }} className="px-8 py-4 bg-rose-500 rounded-2xl font-black hover:bg-rose-600 transition-all">Gán XL</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {exceptions.map(ex => (
            <div key={ex.idhs} className="bg-slate-800 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-700 flex items-center gap-2">
              {state.students.find((s:any)=>s.idhs===ex.idhs)?.name}: {ex.rank}
              <Trash2 size={12} className="text-rose-400 cursor-pointer" onClick={() => setExceptions(exceptions.filter(e => e.idhs !== ex.idhs))} />
            </div>
          ))}
        </div>
      </div>

      {/* BẢNG KẾT QUẢ */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-6 font-black text-slate-400 text-[10px] uppercase">Hạng</th>
              <th className="p-6 font-black text-slate-400 text-[10px] uppercase">Học sinh</th>
              <th className="p-6 font-black text-slate-400 text-[10px] uppercase text-center">{mode === 'year' ? 'Quy tắc' : 'Điểm'}</th>
              <th className="p-6 font-black text-slate-400 text-[10px] uppercase text-center">Xếp loại</th>
            </tr>
          </thead>
          <tbody>
            {finalGrades.map((s, idx) => (
              <tr key={s.idhs} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors">
                <td className="p-6 font-black text-slate-200">#{idx + 1}</td>
                <td className="p-6 font-bold text-slate-700">{s.name}</td>
                <td className="p-6 text-center font-black text-indigo-600 text-lg">
                  {mode === 'year' ? <span className="text-[10px] text-slate-300">HK1+HK2</span> : s.totalScore}
                </td>
                <td className="p-6 text-center">
                  <span className={`px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-tighter ${s.isManual ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : s.finalRank === 'Tốt' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                    {s.finalRank}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={handleSave} disabled={isCalculating} className="w-full py-8 bg-slate-900 text-white rounded-[40px] font-black text-2xl flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all shadow-2xl">
        <Save size={
