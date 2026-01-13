import React, { useState, useMemo } from 'react';
import { Calculator, Trophy, UserPlus, Trash2, Save, AlertTriangle } from 'lucide-react';

export const GradingManager = ({ state, setState }: any) => {
  const [isCalculating, setIsCalculating] = useState(false);
  
  // 1. State chỉ tiêu số lượng
  const [quota, setQuota] = useState({ tot: 40, kha: 5, dat: 0, chuadat: 0 });
  
  // 2. State danh sách xếp loại riêng (Ngoại lệ)
  const [exceptions, setExceptions] = useState<{idhs: string, rank: string}[]>([]);
  const [selectedExStudent, setSelectedExStudent] = useState('');
  const [selectedExRank, setSelectedExRank] = useState('Chưa Đạt');

  // 3. LOGIC XẾP LOẠI TỔNG HỢP
  const finalGrades = useMemo(() => {
    // A. Tính điểm và gom nhóm (Dữ liệu giả lập từ tuần hiện tại)
    let list = state.students.map((s: any) => ({
      ...s,
      totalScore: 100, // Thầy thay bằng logic tính tổng điểm thực tế
    }));

    // B. Sắp xếp theo điểm giảm dần
    list.sort((a: any, b: any) => b.totalScore - a.totalScore);

    // C. Hàm hỗ trợ phân loại theo chỉ tiêu (có xử lý bằng điểm)
    const assignRanks = (students: any[]) => {
      let currentIdx = 0;
      const result = students.map(s => ({ ...s, autoRank: 'Không XL' }));

      const applyRank = (rankName: string, count: number) => {
        if (count <= 0 || currentIdx >= result.length) return;
        
        let lastInRankIdx = currentIdx + count - 1;
        if (lastInRankIdx >= result.length) lastInRankIdx = result.length - 1;
        
        const thresholdScore = result[lastInRankIdx].totalScore;
        
        // Duyệt tiếp để lấy hết những bạn bằng điểm threshold
        for (let i = currentIdx; i < result.length; i++) {
          if (i <= lastInRankIdx || result[i].totalScore === thresholdScore) {
            result[i].autoRank = rankName;
            currentIdx = i + 1;
          } else {
            break;
          }
        }
      };

      applyRank('Tốt', Number(quota.tot));
      applyRank('Khá', Number(quota.kha));
      applyRank('Đạt', Number(quota.dat));
      applyRank('Chưa Đạt', Number(quota.chuadat));
      
      return result;
    };

    const rankedList = assignRanks(list);

    // D. Áp dụng ngoại lệ (Exceptions)
    return rankedList.map(s => {
      const ex = exceptions.find(e => e.idhs === s.idhs);
      return { ...s, finalRank: ex ? ex.rank : s.autoRank, isManual: !!ex };
    });
  }, [state.students, quota, exceptions]);

  const addException = () => {
    if (!selectedExStudent) return;
    if (exceptions.find(e => e.idhs === selectedExStudent)) return alert("HS này đã có trong danh sách riêng!");
    setExceptions([...exceptions, { idhs: selectedExStudent, rank: selectedExRank }]);
    setSelectedExStudent('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* KHỐI 1: NHẬP CHỈ TIÊU */}
      <div className="bg-white p-8 rounded-[35px] shadow-sm border border-slate-100">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-800">
          <Calculator className="text-indigo-500" /> THIẾT LẬP CHỈ TIÊU TUẦN
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Object.keys(quota).map((key) => (
            <div key={key} className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 ml-2">{key}</label>
              <input 
                type="number" 
                value={(quota as any)[key]} 
                onChange={(e) => setQuota({...quota, [key]: e.target.value})}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-center focus:border-indigo-500 outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* KHỐI 2: XẾP LOẠI RIÊNG (NGOẠI LỆ) */}
      <div className="bg-slate-900 p-8 rounded-[35px] text-white shadow-xl">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2">
          <AlertTriangle className="text-yellow-400" /> XẾP LOẠI RIÊNG (NGOẠI LỆ)
        </h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <select 
              value={selectedExStudent} onChange={e => setSelectedExStudent(e.target.value)}
              className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl outline-none text-white font-bold"
            >
              <option value="">-- Chọn học sinh --</option>
              {state.students.map((s: any) => <option key={s.idhs} value={s.idhs}>{s.name}</option>)}
            </select>
          </div>
          <div className="w-40">
            <select 
              value={selectedExRank} onChange={e => setSelectedExRank(e.target.value)}
              className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl outline-none text-white font-bold"
            >
              {['Tốt', 'Khá', 'Đạt', 'Chưa Đạt', 'Không XL'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={addException} className="p-4 bg-yellow-500 hover:bg-yellow-400 text-slate-900 rounded-2xl font-black flex items-center gap-2">
            <UserPlus size={20} /> THÊM
          </button>
        </div>
        
        {/* List ngoại lệ hiện tại */}
        <div className="mt-6 flex flex-wrap gap-3">
          {exceptions.map(ex => (
            <div key={ex.idhs} className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-3">
              <span className="text-sm font-bold">{state.students.find((s:any)=>s.idhs===ex.idhs)?.name} → {ex.rank}</span>
              <button onClick={() => setExceptions(exceptions.filter(e => e.idhs !== ex.idhs))} className="text-rose-500 hover:text-rose-400">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* KHỐI 3: BẢNG TỔNG HỢP KẾT QUẢ */}
      <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-100">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
            <tr>
              <th className="p-6">Hạng</th>
              <th className="p-6">Học sinh</th>
              <th className="p-6 text-center">Tổng Điểm</th>
              <th className="p-6 text-center">Xếp Loại</th>
            </tr>
          </thead>
          <tbody>
            {finalGrades.map((s, idx) => (
              <tr key={s.idhs} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="p-6 font-black text-slate-300">#{idx + 1}</td>
                <td className="p-6">
                  <div className="font-bold text-slate-800">{s.name}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">{s.idhs}</div>
                </td>
                <td className="p-6 text-center font-black text-xl text-slate-700">{s.totalScore}</td>
                <td className="p-6 text-center">
                  <span className={`px-4 py-2 rounded-full font-black text-xs ${
                    s.isManual ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-200' : 
                    s.finalRank === 'Tốt' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {s.finalRank} {s.isManual && ' (Riêng)'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="w-full py-6 bg-slate-900 text-white rounded-[30px] font-black text-xl shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3">
        <Save /> LƯU KẾT QUẢ VÀO SHEET(TUAN) & SHEET(XEPLOAI)
      </button>
    </div>
  );
};
