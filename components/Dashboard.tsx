import React, { useState, useEffect } from 'react';
import { 
  Users, Award, UserCircle2, X, Sparkles, CalendarDays, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react';

export const Dashboard = ({ state, setState, setActiveTab }: any) => {
  const [showStudentList, setShowStudentList] = useState(false);
  const [searchMember, setSearchMember] = useState('');
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [aiGreeting, setAiGreeting] = useState('Đang kết nối AI...');

  // 1. LOGIC LỜI CHÀO AI (Giữ nguyên gốc của thầy)
 useEffect(() => {
  const fetchGreeting = () => {
    // Thầy có thể giữ setTimeout để tạo cảm giác AI đang "suy nghĩ" một chút rồi mới chào
    setTimeout(() => {
      setAiGreeting(`Giáo viên chủ nhiệm: ${state.gvcnName}`);
    }, 800);
  };
  fetchGreeting();
}, [state.gvcnName]);

  // 2. LOGIC SLIDE ẢNH TỰ ĐỘNG
  useEffect(() => {
    if (state.newsData && state.newsData.length > 1) {
      const timer = setInterval(() => {
        setCurrentImgIndex((prev) => (prev + 1) % state.newsData.length);
      }, 4000); 
      return () => clearInterval(timer);
    }
  }, [state.newsData]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* KHỐI 1: HEADER AI & CHỌN TUẦN (Sự kết hợp hoàn hảo) */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Lời chào AI */}
        <div className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 rounded-[40px] text-white shadow-2xl flex items-center gap-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-16 bg-white/10 rounded-full -mr-10 -mt-10 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[28px] flex items-center justify-center shadow-inner relative z-10">
            <Sparkles size={40} className="text-amber-300 animate-pulse" />
          </div>
          <div className="relative z-10">
            <h2 className="text-xs font-black text-indigo-200 uppercase tracking-[0.3em] mb-2">Trợ lý ảo thông minh</h2>
            <p className="text-2xl font-black leading-tight tracking-tight uppercase">
              {aiGreeting}
            </p>
          </div>
        </div>

        {/* Chọn Tuần & Ngày tháng */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-center gap-4">
          <div className="relative group">
            <select 
              value={state.currentWeek}
              onChange={(e) => setState((prev: any) => ({ ...prev, currentWeek: parseInt(e.target.value) }))}
              className="appearance-none bg-indigo-50 border-2 border-indigo-100 text-indigo-700 px-8 py-4 rounded-3xl font-black text-sm uppercase tracking-widest focus:outline-none focus:border-indigo-400 transition-all pr-12 shadow-sm w-full"
            >
              {[...Array(40)].map((_, i) => (
                <option key={i+1} value={i+1}>Tuần học {i+1}</option>
              ))}
            </select>
            <CalendarDays className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400" size={18} />
          </div>
          
            <div className="hidden md:block bg-slate-900 text-white px-8 py-4 rounded-3xl font-black text-[12px] uppercase tracking-widest shadow-xl">
  {(() => {
    const d = new Date();
    const thu = d.toLocaleDateString('vi-VN', { weekday: 'long' }); // Trả về "thứ năm"
    const ngay = d.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }); // Trả về "15/01/2026"
    
    // Viết hoa chữ cái đầu (t -> T) và ghép lại
    return thu.charAt(0).toUpperCase() + thu.slice(1) + ", " + ngay;
  })()}

          </div>
        </div>
      </div>

      {/* KHỐI 2: ẢNH HOẠT ĐỘNG & TIN TỨC */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Slide Ảnh */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3 ml-4">
            <CalendarDays className="text-indigo-600" size={20}/>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Hoạt động lớp gần đây</h3>
          </div>
          <div className="relative h-[450px] rounded-[50px] overflow-hidden group shadow-2xl border-8 border-white bg-slate-900">
            {state.newsData && state.newsData.length > 0 ? (
              <>
                <img 
                  src={state.newsData[currentImgIndex].link} 
                  key={state.newsData[currentImgIndex].link}
                  className="w-full h-full object-cover animate-in fade-in zoom-in duration-1000" 
                  alt="Hoạt động"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent flex items-end p-12">
                  <p className="text-white text-2xl font-black uppercase tracking-tight italic drop-shadow-lg">
                    {state.newsData[currentImgIndex].title}
                  </p>
                </div>
                {state.newsData.length > 1 && (
                  <div className="absolute top-1/2 -translate-y-1/2 w-full px-6 flex justify-between opacity-0 group-hover:opacity-100 transition-all">
                     <button onClick={() => setCurrentImgIndex(prev => (prev - 1 + state.newsData.length) % state.newsData.length)} className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/50"><ChevronLeft/></button>
                     <button onClick={() => setCurrentImgIndex(prev => (prev + 1) % state.newsData.length)} className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/50"><ChevronRight/></button>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 font-black uppercase text-[10px]">Đang cập nhật ảnh hoạt động...</div>
            )}
          </div>
        </div>

        {/* Bảng Tin */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 ml-4">
            <AlertCircle className="text-rose-600" size={20}/>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Bảng tin tức</h3>
          </div>
          <div className="bg-white p-8 rounded-[50px] border border-slate-100 shadow-sm h-[450px] overflow-y-auto custom-scrollbar space-y-4">
            {state.newsList && state.newsList.length > 0 ? state.newsList.map((item: any, idx: number) => (
              <a key={idx} href={item.link} target="_blank" rel="noreferrer" className="flex items-start gap-4 p-5 bg-slate-50 rounded-[30px] hover:bg-indigo-50 transition-all group border border-transparent hover:border-indigo-100">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Award size={20}/>
                </div>
                <div className="flex-1">
                  <p className="font-black text-[11px] text-slate-700 uppercase leading-tight line-clamp-2">{item.news}</p>
                  <span className="text-[9px] font-bold text-slate-400 group-hover:text-indigo-400">Xem chi tiết →</span>
                </div>
              </a>
            )) : (
              <div className="text-center py-20 text-slate-300 font-bold uppercase text-[10px]">Đang cập nhật ....</div>
            )}
          </div>
        </div>
      </div>

      {/* KHỐI 3: BAN CÁN SỰ LỚP (GIỮ NGUYÊN) */}
      <div className="space-y-6 pb-10">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3 text-indigo-600">
            <Users size={24}/>
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800">Ban cán sự lớp</h3>
          </div>
         <button 
  onClick={() => setShowStudentList(true)} 
  className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm group"
>
  <Users size={14} className="group-hover:text-white transition-colors" />
  <span>Xem danh sách lớp</span>
</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {state.bchNames.map((member: any, idx: number) => (
            <div key={idx} className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-xl transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-inner flex-shrink-0">
                {member.avatarUrl ? <img src={member.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><UserCircle2 size={32}/></div>}
              </div>
              <div>
                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{member.position}</div>
                <div className="font-black text-slate-800 uppercase text-xs tracking-tight">{member.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DANH SÁCH HỌC SINH */}
      {showStudentList && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-6xl h-[85vh] rounded-[60px] shadow-2xl overflow-hidden flex flex-col relative">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Users size={28}/></div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Danh sách học sinh</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sĩ số: {state.students.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input type="text" placeholder="Tìm tên..." className="bg-slate-50 border-2 border-slate-100 px-8 py-3 rounded-2xl outline-none focus:border-indigo-500 text-sm font-bold" onChange={(e) => setSearchMember(e.target.value)} />
                <button onClick={() => setShowStudentList(false)} className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><X size={24}/></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 bg-slate-50/30 custom-scrollbar">
              {state.students.filter((s: any) => s.name.toLowerCase().includes(searchMember.toLowerCase())).map((student: any, idx: number) => (
                <div key={idx} className="bg-white rounded-[32px] p-5 border border-slate-100 text-center hover:shadow-2xl transition-all group">
                  <div className="w-full aspect-square rounded-[24px] bg-slate-100 mb-4 overflow-hidden border-2 border-white flex items-center justify-center">
                    {student.avatarUrl ? <img src={student.avatarUrl} className="w-full h-full object-cover" /> : <UserCircle2 size={64} className="text-slate-200"/>}
                  </div>
                  <div className="font-black text-slate-800 text-xs uppercase mb-1">{student.name}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{student.idhs}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
