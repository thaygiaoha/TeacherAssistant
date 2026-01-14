import React, { useState, useMemo } from 'react';
import { Calculator, Trophy, UserPlus, Trash2, Save, AlertTriangle, Calendar, Star, ChevronRight, CheckCircle2 } from 'lucide-react';

export const GradingManager = ({ state, setState }: any) => {
  const [mode, setMode] = useState<'week' | 'semester' | 'year'>('week');
  const [subMode, setSubMode] = useState('HK1'); 
  const [range, setRange] = useState({ from: 1, to: 18 }); 
  const [isCalculating, setIsCalculating] = useState(false);
  
  const [quota, setQuota] = useState({ tot: 43, kha: 3, dat: 0, chuadat: 0 });
  const [exceptions, setExceptions] = useState<{idhs: string, rank: string}[]>([]);
  const [selectedExStudent, setSelectedExStudent] = useState('');
  const [selectedExRank, setSelectedExRank] = useState('Chưa Đạt');

 // --- 1. LOGIC TÍNH TOÁN ĐIỂM VÀ XẾP LOẠI ---
const finalGrades = useMemo(() => {
    // 1. Bản đồ điểm (violations, rewards, bch)
    const scoreMap: Record<string, number> = {};
    state.violations?.forEach((v: any) => { scoreMap[String(v.codeRule).trim().toUpperCase()] = Math.abs(Number(v.points) || 0); });
    state.rewards?.forEach((r: any) => { scoreMap[String(r.codeBonus).trim().toUpperCase()] = Math.abs(Number(r.points) || 0); });
    state.bch?.forEach((b: any) => { scoreMap[String(b.codeTitle).trim().toUpperCase()] = Math.abs(Number(b.points) || 0); });

    // 2. Duyệt danh sách học sinh
    let list = state.students.map((student: any) => {
      let totalScore = 100; // Reset 100 điểm mỗi tuần
      let autoRank = 'Không XL';
      const sId = String(student.idhs).trim();
      const targetWeek = String(state.currentWeek); // Số 5 từ giao diện của thầy

      if (mode === 'week') {
        // --- TÍNH ĐIỂM TRỪ ---
        const vLog = state.violationLogs?.find((l: any) => String(l.idhs).trim() === sId);
        if (vLog && vLog.v_logs) {
          // Tìm tuần khớp với số hiện tại (ví dụ: tìm "Tuần 5" hoặc "5" hoặc "w5")
          const weekKey = Object.keys(vLog.v_logs).find(k => k.replace(/\D/g, '') === targetWeek);
          
          if (weekKey) {
            const codes = vLog.v_logs[weekKey];
            if (Array.isArray(codes)) {
              codes.forEach(code => {
                const pts = scoreMap[String(code).trim().toUpperCase()] || 0;
                totalScore -= pts; // Vi phạm 3 lần V01 thì trừ 3 lần điểm
              });
            }
          }
        }

        // --- TÍNH ĐIỂM THƯỞNG ---
        const rLog = state.rewardLogs?.find((l: any) => String(l.idhs).trim() === sId);
        if (rLog && rLog.t_logs) {
          const weekKey = Object.keys(rLog.t_logs).find(k => k.replace(/\D/g, '') === targetWeek);
          if (weekKey) {
            const codes = rLog.t_logs[weekKey];
            if (Array.isArray(codes)) {
              codes.forEach(code => {
                const pts = scoreMap[String(code).trim().toUpperCase()] || 0;
                totalScore += pts;
              });
            }
          }
        }
      } else if (mode === 'semester') {
        totalScore = 0;
        const sRow = state.weeklyScores?.find((r: any) => String(r.idhs).trim() === sId);
        if (sRow && sRow.weeks) {
          for (let w = range.from; w <= range.to; w++) {
            totalScore += Number(sRow.weeks[`w${w}`] || 0);
          }
        }
      }

      return { ...student, totalScore, autoRank };
    });

    // 3. Phân hạng (Giữ nguyên logic xếp hạng của thầy)
    if (mode !== 'year') {
      list.sort((a, b) => b.totalScore - a.totalScore);
      let currentIdx = 0;
      const rankedList = list.map(s => ({ ...s, autoRank: 'Chưa đạt' }));
      const applyRank = (rankName: string, targetCount: number) => {
        let count = Number(targetCount);
        if (count <= 0 || currentIdx >= rankedList.length) return;
        let lastIdx = Math.min(currentIdx + count - 1, rankedList.length - 1);
        const threshold = rankedList[lastIdx].totalScore;
        for (let i = currentIdx; i < rankedList.length; i++) {
          if (i <= lastIdx || rankedList[i].totalScore === threshold) {
            rankedList[i].autoRank = rankName;
            currentIdx = i + 1;
          } else break;
        }
      };
      applyRank('Tốt', quota.tot);
      applyRank('Khá', quota.kha);
      applyRank('Đạt', quota.dat);
      applyRank('Chưa Đạt', quota.chuadat);
      list = rankedList;
    }

    return list.map(s => {
      const ex = exceptions.find(e => e.idhs === s.idhs);
      return { ...s, finalRank: ex ? ex.rank : s.autoRank, isManual: !!ex };
    });
  }, [state, mode, range, quota, exceptions]);

  // =================
const handleSave = async () => {
    if (!state.googleScriptUrl) return alert("❌ Chưa có link Script!");
    setIsCalculating(true);
    
    try {
      // SỬA TẠI ĐÂY: Dùng finalGrades thay vì sortedStudents nếu sortedStudents chưa định nghĩa
      const scores = finalGrades.map((s: any) => ({ 
        idhs: s.idhs, 
        totalScore: s.totalScore 
      }));
      const ranks = finalGrades.map((s: any) => ({ 
        idhs: s.idhs, 
        finalRank: s.finalRank 
      }));

      await fetch(state.googleScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          action: 'save_grading_bulk',
          week: state.currentWeek,
          scores: scores,
          ranks: ranks
        })
      });

      alert(`🎉 Đã chốt xong Tuần ${state.currentWeek} lên Google Sheet!`);
    } catch (err) {
      alert("❌ Lỗi kết nối!");
    } finally {
      setIsCalculating(false);
    }
  };
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-32 p-4">
      {/* THANH ĐIỀU HƯỚNG CHẾ ĐỘ */}
      <div className="flex bg-white p-2 rounded-[35px] shadow-sm border border-slate-100">
        {(['week', 'semester', 'year'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} className={`flex-1 py-4 rounded-[30px] font-black transition-all ${mode === m ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}>
            {m === 'week' ? 'XẾP LOẠI TUẦN' : m === 'semester' ? 'HỌC KỲ' : 'CẢ NĂM'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* THỜI GIAN */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 relative">
          <h4 className="font-black text-slate-400 text-[10px] uppercase mb-4 tracking-widest">Thời gian xét duyệt</h4>
          {mode === 'semester' ? (
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <select value={subMode} onChange={e => setSubMode(e.target.value)} className="bg-transparent font-black outline-none border-r pr-4 border-slate-200">
                <option value="HK1">HK1</option><option value="HK2">HK2</option>
              </select>
              <div className="flex items-center gap-2 flex-1 justify-center">
                <input type="number" value={range.from} onChange={e => setRange({...range, from: Number(e.target.value)})} className="w-12 text-center bg-white rounded-xl shadow-sm font-black" />
                <ChevronRight size={14} className="text-slate-300"/>
                <input type="number" value={range.to} onChange={e => setRange({...range, to: Number(e.target.value)})} className="w-12 text-center bg-white rounded-xl shadow-sm font-black" />
              </div>
            </div>
          ) : <div className="text-2xl font-black text-slate-800">{mode === 'week' ? `Tuần ${state.currentWeek}` : 'Học kỳ 1 & 2'}</div>}
        </div>

        {/* CHỈ TIÊU */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <h4 className="font-black text-slate-400 text-[10px] uppercase mb-4 tracking-widest">Chỉ tiêu số lượng</h4>
          <div className="grid grid-cols-4 gap-2">
            {['tot', 'kha', 'dat', 'chuadat'].map(k => (
              <div key={k}>
                <input disabled={mode==='year'} type="number" value={(quota as any)[k]} onChange={e => setQuota({...quota, [k]: e.target.value})} className="w-full bg-slate-50 p-3 rounded-2xl text-center font-black text-lg disabled:opacity-20 border border-slate-100" />
                <div className="text-[8px] font-black text-slate-300 uppercase text-center mt-1">{k}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NGOẠI LỆ */}
      <div className="bg-indigo-950 p-8 rounded-[40px] text-white shadow-2xl">
        <h3 className="text-sm font-black mb-6 text-indigo-300 flex items-center gap-2 uppercase tracking-widest"><AlertTriangle size={18}/> Xếp loại đặc biệt</h3>
        <div className="flex flex-wrap gap-4">
          <select value={selectedExStudent} onChange={e => setSelectedExStudent(e.target.value)} className="flex-1 min-w-[200px] p-5 bg-indigo-900/50 rounded-3xl font-bold outline-none border border-indigo-800 text-white">
            <option value="">Chọn học sinh...</option>
            {state.students.map((s:any) => <option key={s.idhs} value={s.idhs}>{s.name} - {s.idhs}</option>)}
          </select>
          <select value={selectedExRank} onChange={e => setSelectedExRank(e.target.value)} className="w-40 p-5 bg-indigo-900/50 rounded-3xl font-bold outline-none border border-indigo-800 text-white">
            {['Tốt', 'Khá', 'Đạt', 'Chưa Đạt', 'Không XL'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={() => { if(selectedExStudent) setExceptions([...exceptions, {idhs: selectedExStudent, rank: selectedExRank}]); setSelectedExStudent(''); }} className="px-10 py-5 bg-amber-500 rounded-3xl font-black text-indigo-950 hover:bg-amber-400">GÁN</button>
        </div>
        {exceptions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {exceptions.map(ex => (
              <div key={ex.idhs} className="bg-indigo-900 px-4 py-2 rounded-2xl text-xs border border-indigo-800 flex items-center gap-3">
                {state.students.find((s:any)=>s.idhs===ex.idhs)?.name}: {ex.rank}
                <Trash2 size={14} className="text-rose-400 cursor-pointer" onClick={() => setExceptions(exceptions.filter(e => e.idhs !== ex.idhs))} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BẢNG TỔNG HỢP */}
      <div className="bg-white rounded-[45px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-8 font-black text-slate-400 text-[10px] uppercase">Hạng</th>
              <th className="p-8 font-black text-slate-400 text-[10px] uppercase">Học sinh</th>
              <th className="p-8 font-black text-slate-400 text-[10px] uppercase text-center">{mode === 'year' ? 'Nguồn' : 'Điểm'}</th>
              <th className="p-8 font-black text-slate-400 text-[10px] uppercase text-center">Xếp loại</th>
            </tr>
          </thead>
          <tbody>
            {finalGrades.map((s, idx) => (
              <tr key={s.idhs} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors">
                <td className="p-8 font-black text-slate-200 text-2xl">#{idx + 1}</td>
                <td className="p-8">
                    <div className="font-black text-slate-800 text-lg leading-tight">{s.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">{s.idhs}</div>
                </td>
                <td className="p-8 text-center font-black text-indigo-600 text-2xl">
                  {mode === 'year' ? <span className="text-xs text-slate-300 italic uppercase">HK1+HK2</span> : s.totalScore}
                </td>
                <td className="p-8 text-center">
                  <span className={`px-6 py-3 rounded-[20px] font-black text-xs uppercase ${s.isManual ? 'bg-rose-500 text-white' : s.finalRank === 'Tốt' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {s.finalRank}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* NÚT LƯU */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-6xl">
        <button onClick={handleSave} disabled={isCalculating} className="w-full py-8 bg-slate-900 text-white rounded-[40px] font-black text-xl flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all shadow-2xl active:scale-[0.98]">
          {isCalculating ? "ĐANG LƯU DỮ LIỆU..." : <><Save size={24} /> XÁC NHẬN LƯU HỆ THỐNG</>}
        </button>
      </div>
    </div>
  );
};
