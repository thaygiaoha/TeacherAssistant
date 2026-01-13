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

  const finalGrades = useMemo(() => {
    // 1. Bản đồ điểm tra cứu từ các bảng danh mục
    const scoreMap: Record<string, number> = {};
    const buildScoreMap = (data: any[]) => {
      data?.forEach(item => {
        const code = String(item.codeRule || item[0] || "").trim().toUpperCase();
        const pts = Math.abs(Number(item.points || item[2]) || 0);
        if (code) scoreMap[code] = pts;
      });
    };
    buildScoreMap(state.violations);
    buildScoreMap(state.rewards);
    buildScoreMap(state.bch);

    // 2. Quy tắc Cả năm T-T=T, T-K=K...
    const yearRule: Record<string, string> = {
      'Tốt-Tốt': 'Tốt', 'Tốt-Khá': 'Khá', 'Khá-Tốt': 'Khá', 'Khá-Khá': 'Khá',
      'Tốt-Đạt': 'Đạt', 'Khá-Đạt': 'Đạt', 'Đạt-Khá': 'Đạt', 'Đạt-Đạt': 'Đạt',
      'Tốt-Chưa Đạt': 'Chưa Đạt', 'Chưa Đạt-Tốt': 'Chưa Đạt'
    };

    // 3. Hàm quét điểm từ Logs theo IDHS (Xử lý mảng hoặc object)
    const getScoreFromLogs = (logs: any[], studentId: string) => {
      let score = 0;
      if (!logs || !Array.isArray(logs)) return 0;
      const sId = String(studentId).trim();

      logs.forEach((row: any) => {
        const cells = Array.isArray(row) ? row : Object.values(row);
        // Kiểm tra xem hàng này có chứa IDHS không
        const isMyRow = cells.some(c => String(c).trim() === sId);
        if (isMyRow) {
          cells.forEach(c => {
            const code = String(c).trim().toUpperCase();
            if (scoreMap[code]) score += scoreMap[code];
          });
        }
      });
      return score;
    };

    // 4. Tính toán danh sách
    let list = state.students.map((student: any) => {
      let totalScore = 0;
      let autoRank = 'Không XL';
      const sId = String(student.idhs).trim();

      if (mode === 'week') {
        const minus = getScoreFromLogs(state.violationLogs, sId);
        const plus = getScoreFromLogs(state.rewardLogs, sId);
        totalScore = 100 - minus + plus;
      } else if (mode === 'semester') {
        const sRow = state.weeklyScores?.find((r: any) => String(r.idhs || r[1]).trim() === sId);
        if (sRow) {
          for (let w = range.from; w <= range.to; w++) {
            totalScore += Number(sRow[`w${w}`] || 0);
          }
        }
      } else if (mode === 'year') {
        const xRow = state.allRanks?.find((r: any) => String(r.idhs || r[1]).trim() === sId) || {};
        const hk1 = xRow['HK1'] || 'Không XL';
        const hk2 = xRow['HK2'] || 'Không XL';
        autoRank = yearRule[`${hk1}-${hk2}`] || (hk2 !== 'Không XL' ? hk2 : 'Không XL');
      }

      return { ...student, totalScore, autoRank };
    });

    // 5. Phân hạng (Chỉ cho Tuần/HK)
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

    return list.map(s => {
      const ex = exceptions.find(e => e.idhs === s.idhs);
      return { ...s, finalRank: ex ? ex.rank : s.autoRank, isManual: !!ex };
    });
  }, [state, mode, subMode, range, quota, exceptions]);

  const handleSave = async () => {
    const label = mode === 'week' ? `w${state.currentWeek}` : (mode === 'year' ? 'CN' : subMode);
    if (!window.confirm(`Xác nhận lưu kết quả [${label}]?`)) return;
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
      alert("✅ Đã gửi dữ liệu thành công!");
    } catch (err) { alert("❌ Lỗi kết nối!"); }
    finally { setIsCalculating(false); }
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
