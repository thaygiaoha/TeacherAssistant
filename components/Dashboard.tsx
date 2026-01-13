import React from 'react';
import { Users, Mars, Venus, Search, TrendingUp, Star, Award } from 'lucide-react';

export const Dashboard = ({ state, setState }: any) => {
  const total = state.students?.length || 0;
  const male = state.students?.filter((s: any) => s.gender === 'Nam').length || 0;
  const female = total - male;

  // Hàm xử lý tăng/giảm tuần để đảm bảo State được cập nhật đúng cách
  const updateWeek = (newWeek: number) => {
    const val = Math.max(1, newWeek); // Không cho tuần nhỏ hơn 1
    setState((prev: any) => ({
      ...prev,
      currentWeek: val
    }));
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Trung Tâm Điều Hành</h2>
          <p className="text-slate-400 font-bold mt-2 text-lg">
            Chào mừng Giáo viên chủ nhiệm trở lại - Tuần {state.currentWeek}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-4 rounded-[28px] shadow-sm border border-slate-100 w-full md:w-96">
            <Search className="text-slate-300" size={20}/>
            <input 
              type="text" 
              placeholder="Tìm tên hoặc mã học sinh..." 
              className="bg-transparent border-none outline-none font-bold text-slate-700 w-full text-sm"
            />
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard 
          icon={<Users size={28}/>} 
          label="Sĩ số lớp" 
          value={total} 
          desc="Học sinh chính thức"
          color="bg-indigo-600"
        />
        <StatCard 
          icon={<Mars size={28}/>} 
          label="Nam sinh" 
          value={male} 
          desc={`${((male/total)*100 || 0).toFixed(0)}% tổng sĩ số`}
          color="bg-blue-500"
        />
        <StatCard 
          icon={<Venus size={28}/>} 
          label="Nữ sinh" 
          value={female} 
          desc={`${((female/total)*100 || 0).toFixed(0)}% tổng sĩ số`}
          color="bg-rose-500"
        />
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[48px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex justify-between items-center">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Tổng hợp thi đua Tuần
                </h3>
                
                {/* NÚT BẤM ĐÃ FIX LOGIC TẠI ĐÂY */}
                <div className="flex items-center bg-slate-100 rounded-xl p-1 group">
                  <button 
                    type="button"
                    onClick={() => updateWeek(state.currentWeek - 1)}
                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-indigo-600 font-black transition-colors"
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    value={state.currentWeek}
                    onChange={(e) => updateWeek(parseInt(e.target.value) || 1)}
                    className="w-10 bg-transparent text-center font-black text-indigo-600 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button 
                    type="button"
                    onClick={() => updateWeek(state.currentWeek + 1)}
                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-indigo-600 font-black transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="text-slate-400 text-xs font-bold mt-1 tracking-widest uppercase">Cập nhật thời gian thực</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-5 py-2.5 rounded-full border border-emerald-100">
                <TrendingUp size={14}/> Top thi đua
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Học sinh</th>
                  <th className="px-10 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mã HS</th>
                  <th className="px-10 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hạnh kiểm</th>
                  <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Điểm Tuần {state.currentWeek}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {state.students?.length > 0 ? (
                  state.students.map((s: any) => {
                    const scoreObj = state.weeklyScores.find((ws: any) => ws.idhs === s.idhs);
                    const weekScore = scoreObj?.weeks[`w${state.currentWeek}`] ?? 100;
                    return (
                      <tr key={s.idhs} className="hover:bg-slate-50/80 transition-all duration-300 group cursor-default">
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${s.gender === 'Nam' ? 'bg-blue-50 text-blue-500' : 'bg-rose-50 text-rose-500'}`}>
                              {s.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-slate-800 text-base">{s.stt}.{s.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{s.class}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-7 text-center font-mono text-xs text-slate-400 font-bold">{s.idhs}</td>
                        <td className="px-10 py-7 text-center">
                           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${weekScore >= 90 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {weekScore >= 95 ? 'Tốt' : weekScore >= 80 ? 'Khá' : 'Cần rèn luyện'}
                           </span>
                        </td>
                        <td className="px-10 py-7 text-right">
                          <span className={`inline-block min-w-16 text-center px-6 py-2.5 rounded-2xl font-black text-sm shadow-sm transition-all group-hover:scale-105 ${weekScore >= 100 ? 'bg-slate-900 text-white' : 'bg-rose-500 text-white'}`}>
                            {weekScore}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-10 py-40 text-center">
                        <div className="flex flex-col items-center gap-6">
                           <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 animate-pulse">
                              <Users size={48} />
                           </div>
                           <div className="text-slate-400 font-bold text-lg max-w-sm mx-auto leading-relaxed">
                              Lớp chưa có dữ liệu học sinh.<br/>
                              <span className="text-sm font-medium opacity-60 italic">Vui lòng vào "Nhập Danh sách" để tải tệp Excel.</span>
                           </div>
                        </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

function StatCard({ icon, label, value, desc, color }: any) {
    return (
        <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100 flex items-center gap-8 transition-all hover:translate-y-[-4px] duration-500 group">
            <div className={`${color} w-20 h-20 rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{value}</h3>
              <p className="text-[10px] font-bold text-slate-400 italic">{desc}</p>
            </div>
        </div>
    );
}
