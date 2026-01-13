import React, { useState, useEffect } from 'react';
import { 
  Newspaper, Users, Award, Camera, ChevronRight, 
  ExternalLink, UserCircle2, X, Search, Activity, Calendar
} from 'lucide-react';

export const Dashboard = ({ state, setActiveTab }: any) => { // Thêm setActiveTab để chuyển trang
  const [currentImg, setCurrentImg] = useState(0);
  const [showStudentList, setShowStudentList] = useState(false);
  const [searchMember, setSearchMember] = useState('');

  const photos = state.newsData || []; 
  const newsList = state.newsList || []; 
  const bch = state.bch || [];

  useEffect(() => {
    if (photos.length > 0) {
      const timer = setInterval(() => {
        setCurrentImg((prev) => (prev + 1) % photos.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [photos]);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      
      {/* 1. KHU VỰC ẢNH & TIN TỨC */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative group overflow-hidden rounded-[48px] bg-slate-200 aspect-video shadow-2xl">
          {photos.length > 0 ? (
            <>
              <img 
                src={photos[currentImg].link} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                alt="Hoạt động"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold text-xs uppercase tracking-[0.2em]">
                  <Camera size={14}/> Hoạt động lớp
                </div>
                <h3 className="text-2xl font-black">{photos[currentImg].title}</h3>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold italic">Chưa có ảnh hoạt động</div>
          )}
        </div>

        <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-800">
            <Newspaper size={24} className="text-indigo-500"/> Tin tức mới
          </h3>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
            {newsList.map((news: any, idx: number) => (
              <a key={idx} href={news.linknew || news.link} target="_blank" rel="noreferrer" className="flex items-start gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
                <div>
                  <div className="font-bold text-slate-700 leading-snug group-hover:text-indigo-600 transition-colors">{news.news || news.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 uppercase font-black tracking-wider">Xem chi tiết <ExternalLink size={10}/></div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* 2. BAN CHẤP HÀNH & NÚT ĐIỀU KHIỂN */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <h3 className="text-xl font-black flex items-center gap-3 text-slate-800">
              <Award size={24} className="text-amber-500"/> Ban chấp hành lớp
            </h3>
            
            <div className="flex gap-3">
              {/* NÚT TUẦN ĐÁNH GIÁ */}
              <div className="px-6 py-4 bg-indigo-50 rounded-2xl flex items-center gap-3 border border-indigo-100">
                <Calendar className="text-indigo-600" size={20} />
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase leading-none">Tuần đánh giá</p>
                  <p className="text-lg font-black text-indigo-900 leading-none mt-1">Tuần {state.currentWeek}</p>
                </div>
              </div>

              {/* NÚT HỒ SƠ LỚP HỌC - TO & XANH CYAN */}
              <button 
                onClick={() => setShowStudentList(true)}
                className="px-8 py-4 bg-cyan-500 text-white rounded-[24px] font-black text-sm hover:bg-cyan-600 transition-all shadow-xl shadow-cyan-200 flex items-center gap-3 animate-pulse hover:animate-none"
              >
                <Users size={24}/> HỒ SƠ LỚP HỌC
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bch.map((mem: any, idx: number) => (
              <div key={idx} className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 text-center group hover:bg-indigo-600 transition-all duration-300">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm mx-auto mb-3 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                   <UserCircle2 size={20}/>
                </div>
                <div className="text-[9px] font-black text-indigo-500 uppercase mb-1 group-hover:text-indigo-200">{mem.position}</div>
                <div className="font-black text-slate-800 text-sm group-hover:text-white">{mem.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CỘT KỶ LUẬT - BẤM VÀO ĐỂ XEM CHI TIẾT */}
        <button 
          onClick={() => setActiveTab('actions')} // Bấm vào là nhảy sang tab Nhập Lỗi
          className="bg-rose-500 p-8 rounded-[48px] text-white shadow-xl shadow-rose-200 relative overflow-hidden flex flex-col justify-center text-left transition-transform hover:scale-105 active:scale-95"
        >
          <div className="relative z-10">
            <h3 className="text-lg font-black mb-2 tracking-tight">Kỷ luật tuần</h3>
            <div className="text-7xl font-black mb-2 tracking-tighter">
              {state.violationLogs?.length || 0}
            </div>
            <p className="text-rose-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              Bấm để xem chi tiết <ChevronRight size={14}/>
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-20 transform rotate-12 text-white">
            <Activity size={150} />
          </div>
        </button>
      </div>

      {/* MODAL HỒ SƠ LỚP HỌC */}
      {showStudentList && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowStudentList(false)}></div>
          <div className="bg-white w-full max-w-5xl max-h-[85vh] rounded-[48px] shadow-2xl relative z-10 flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Hồ sơ học sinh</h2>
                <p className="text-cyan-500 text-xs font-black uppercase tracking-widest mt-1">Sĩ số: {state.students.length} thành viên</p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                  <input 
                    type="text" 
                    placeholder="Tìm tên hoặc mã..." 
                    className="pl-12 pr-6 py-4 bg-slate-100 rounded-[20px] outline-none focus:ring-4 ring-cyan-50 text-sm w-80 font-bold transition-all"
                    onChange={(e) => setSearchMember(e.target.value)}
                  />
                </div>
                <button onClick={() => setShowStudentList(false)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><X size={24}/></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 custom-scrollbar bg-slate-50/50">
              {state.students
                .filter((s: any) => s.name.toLowerCase().includes(searchMember.toLowerCase()) || (s.idhs && s.idhs.toString().includes(searchMember)))
                .map((student: any, idx: number) => (
                <div key={idx} className="bg-white rounded-[32px] p-4 border border-slate-100 hover:border-cyan-400 hover:shadow-2xl transition-all text-center group">
                  <div className="w-full aspect-[3/4] rounded-2xl bg-slate-100 mb-4 overflow-hidden relative">
                    {student.imglink ? (
                      <img src={student.imglink} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={student.name}/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><UserCircle2 size={48}/></div>
                    )}
                  </div>
                  <div className="font-black text-slate-800 text-sm leading-tight mb-1 uppercase">{student.name}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{student.idhs}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
