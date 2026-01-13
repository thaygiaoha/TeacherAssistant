import React, { useState, useMemo } from 'react';
import { Calculator, Trophy, UserPlus, Trash2, Save, AlertTriangle, CheckCircle } from 'lucide-react';

export const GradingManager = ({ state, setState }: any) => {
  const [isCalculating, setIsCalculating] = useState(false);
  
  // 1. State chỉ tiêu số lượng
  const [quota, setQuota] = useState({ tot: 40, kha: 5, dat: 0, chuadat: 0 });
  
  // 2. State danh sách xếp loại riêng (Ngoại lệ)
  const [exceptions, setExceptions] = useState<{idhs: string, rank: string}[]>([]);
  const [selectedExStudent, setSelectedExStudent] = useState('');
  const [selectedExRank, setSelectedExRank] = useState('Chưa Đạt');

  // 3. LOGIC TÍNH ĐIỂM & XẾP LOẠI
  const finalGrades = useMemo(() => {
    // A. Tính điểm thực tế dựa trên logs
    let list = state.students.map((student: any) => {
      let totalScore = 100; // Điểm gốc là 100

      // 1. Tạo bản đồ tra cứu điểm từ bảng lỗi (state.violations)
      const scoreMap: any = {};
      state.violations.forEach((v: any) => {
        scoreMap[v.codeRule?.toUpperCase()] = -Math.abs(v.points || 0);
      });
      
      // 2. Tạo bản đồ tra cứu điểm từ bảng thưởng & bch
      state.rewards.forEach((r: any) => {
        scoreMap[r.codeRule?.toUpperCase()] = Math.abs(r.points || 0);
      });
      state.bch.forEach((b: any) => {
        scoreMap[b.codeRule?.toUpperCase()] = Math.abs(b.points || 0);
      });

      // 3. Quét danh sách lỗi đã ghi (violationLogs)
      // Giả sử dữ liệu lỗi của thầy có dạng: { studentId: 'HS01', codes: ['L01', 'L02'] }
      const myViolations = state.violationLogs?.filter((log: any) => log.studentId === student.idhs);
      if (myViolations) {
        myViolations.forEach((log: any) => {
          if (Array.isArray(log.codes)) {
            log.codes.forEach((c: string) => {
              totalScore += (scoreMap[c.toUpperCase()] || 0);
            });
          }
        });
      }

      // 4. Quét danh sách thưởng đã ghi (rewardLogs)
      const myRewards = state.rewardLogs?.filter((log: any) => log.studentId === student.idhs);
      if (myRewards) {
        myRewards.forEach((log: any) => {
          if (Array.isArray(log.codes)) {
            log.codes.forEach((c: string) => {
              totalScore += (scoreMap[c.toUpperCase()] || 0);
            });
          }
        });
      }

      return { ...student, totalScore };
    });

    // C. Sắp xếp theo điểm giảm dần
    list.sort((a: any, b: any) => b.totalScore - a.totalScore);

    // D. Hàm phân loại theo chỉ tiêu (Xử lý bằng điểm - Ưu tiên lấy dư)
    const assignRanks = (students: any[]) => {
      let currentIdx = 0;
      const result = students.map(s => ({ ...s, autoRank: 'Không XL' }));

      const applyRank = (rankName: string, count: number) => {
        let num = Number(count);
        if (num <= 0 || currentIdx >= result.length) return;
        
        let lastInRankIdx = currentIdx + num - 1;
        if (lastInRankIdx >= result.length) lastInRankIdx = result.length - 1;
        
        const thresholdScore = result[lastInRankIdx].totalScore;
        
        for (let i = currentIdx; i < result.length; i++) {
          if (i <= lastInRankIdx || result[i].totalScore === thresholdScore) {
            result[i].autoRank = rankName;
            currentIdx = i + 1;
          } else { break; }
        }
      };

      applyRank('Tốt', quota.tot);
      applyRank('Khá', quota.kha);
      applyRank('Đạt', quota.dat);
      applyRank('Chưa Đạt', quota.chuadat);
      return result;
    };

    const rankedList = assignRanks(list);

    // E. Áp dụng ngoại lệ
    return rankedList.map(s => {
      const ex = exceptions.find(e => e.idhs === s.idhs);
      return { ...s, finalRank: ex ? ex.rank : s.autoRank, isManual: !!ex };
    });
  }, [state.students, state.violationLogs, state.rewardLogs, quota, exceptions]);

  // --- HÀM LƯU DỮ LIỆU ---
  const handleSaveAll = async () => {
    if (!window.confirm(`Xác nhận lưu bảng điểm Tuần ${state.currentWeek}?`)) return;
    setIsCalculating(true);
    try {
      const payload = finalGrades.map(s => ({
        idhs: s.idhs,
        score: s.totalScore,
        rank: s.finalRank
      }));

      await fetch(state.googleScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          action: 'save_final_grading',
          week: state.currentWeek,
          results: payload
        })
      });
      alert("✅ Đã lưu xong dữ liệu vào sheet TUAN và XEPLOAI!");
    } catch (err) {
      alert("❌ Lỗi kết nối Script!");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 p-4">
      {/* KHỐI 1: CHỈ TIÊU */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2 tracking-tighter text-slate-800">
          <Trophy className="text-amber-500" /> THIẾT LẬP CHỈ TIÊU TUẦN {state.currentWeek}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.keys(quota).map((key) => (
            <div key={key} className="p-4 bg-slate-50 rounded-[24px] border border-slate-100">
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">{key}</label>
              <input 
                type="number" 
                value={(quota as any)[key]} 
                onChange={(e) => setQuota({...quota, [key]: e.target.value})}
                className="w-full bg-transparent text-2xl font-black text-slate-800 outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* KHỐI 2: NGOẠI LỆ */}
      <div className="bg-slate-900 p-8 rounded-[40px] text-white">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2">
          <AlertTriangle className="text-rose-400" /> XẾP LOẠI NGOẠI LỆ
        </h3>
        <div className="flex flex-wrap gap-4">
          <select 
            value={selectedExStudent} onChange={e => setSelectedExStudent(e.target.value)}
            className="flex-1 min-w-[200px] p-4 bg-slate-800 rounded-2xl border-none font-bold text-white outline-none"
          >
            <option value="">-- Chọn học sinh --</option>
            {state.students.map((s: any) => <option key={s.idhs} value={s.idhs}>{s.name}</option>)}
          </select>
          <select 
            value={selectedExRank} onChange={e => setSelectedExRank(e.target.value)}
            className="w-40 p-4 bg-slate-800 rounded-2xl border-none font-bold text-white outline-none"
          >
            {['Tốt', 'Khá', 'Đạt', 'Chưa Đạt', 'Không XL'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={() => {
            if (!selectedExStudent) return;
            setExceptions([...exceptions, { idhs: selectedExStudent, rank: selectedExRank }]);
            setSelectedExStudent('');
          }} className="px-8 bg-white text-slate-900 rounded-2xl font-black hover:bg-rose-400 transition-colors">
            THÊM
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {exceptions.map(ex => (
            <div key={ex.idhs} className="bg-slate-800 px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-700">
              <span className="text-xs font-bold">{state.students.find((s:any)=>s.idhs===ex.idhs)?.name}: {ex.rank}</span>
              <button onClick={() => setExceptions(exceptions.filter(e => e.idhs !== ex.idhs))} className="text-rose-400"><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
      </div>

      {/* BẢNG KẾT QUẢ */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Hạng</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Học sinh</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase text-center">Điểm</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase text-center">Xếp loại</th>
            </tr>
          </thead>
          <tbody>
            {finalGrades.map((s, idx) => (
              <tr key={s.idhs} className="border-b border-slate-50 last:border-none">
                <td className="p-6 font-black text-slate-300">#{idx + 1}</td>
                <td className="p-6">
                  <div className="font-bold text-slate-800">{s.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{s.idhs}</div>
                </td>
                <td className="p-6 text-center font-black text-slate-700 text-lg">{s.totalScore}</td>
                <td className="p-6 text-center">
                  <span className={`px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-wider ${
                    s.isManual ? 'bg-rose-500 text-white' : 
                    s.finalRank === 'Tốt' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {s.finalRank}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* NÚT LƯU TỔNG HỢP */}
      <button
        onClick={handleSaveAll}
        disabled={isCalculating}
        className="w-full py-8 bg-emerald-600 text-white rounded-[40px] font-black text-2xl shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-4"
      >
        {isCalculating ? "ĐANG LƯU..." : <><Save size={28} /> XÁC NHẬN LƯU BÁO CÁO</>}
      </button>
    </div>
  );
};
