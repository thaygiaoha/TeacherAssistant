import React, { useState, useEffect } from 'react';
import { 
  Newspaper, Users, Award, Camera, ChevronRight, 
  ExternalLink, UserCircle2, X, Search 
} from 'lucide-react';

export const Dashboard = ({ state }: any) => {
  const [currentImg, setCurrentImg] = useState(0);
  const [showStudentList, setShowStudentList] = useState(false);
  const [searchMember, setSearchMember] = useState('');

  // 1. Lấy dữ liệu từ state (đã load từ sheet news và xeploaihk)
  const photos = state.newsData || []; // Giả định thầy load sheet news vào đây
  const newsList = state.newsList || []; 
  const bch = state.bch || [];

  // Tự động chuyển ảnh sau 5 giây
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
      
      {/* 1. KHU VỰC ẢNH HOẠT ĐỘNG & TIN TỨC (Grid 2 cột) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SLIDESHOW ẢNH (2/3 chiều rộng) */}
        <div className="lg:col-span-2 relative group overflow-hidden rounded-[48px] bg-slate-200 aspect-video shadow-2xl">
          {photos.length > 0 ? (
            <>
              <img 
                src={photos[currentImg].link} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                alt="Hoạt động lớp"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold text-xs uppercase tracking-[0.2em]">
                  <Camera size={14}/> Hoạt động lớp
                </div>
                <h3 className="text-2xl font-black">{photos[currentImg].title}</h3>
              </div>
              {/* Dots điều hướng */}
              <div className="absolute bottom-4 right-8 flex gap-2">
                {photos.map((_: any, i: number) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentImg ? 'w-8 bg-indigo-500' : 'w-2 bg-white/50'}`}></div>
                ))}
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold italic">Chưa có ảnh hoạt động</div>
          )}
        </div>

        {/* TIN TỨC & SỰ KIỆN (1/3 chiều rộng) */}
        <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-800">
            <Newspaper size={24} className="text-indigo-500"/> Tin tức mới
          </h3>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {newsList.map((news: any, idx: number) => (
              <a 
                key={idx} 
                href={news.link} 
                target="_blank" 
                className="flex items-start gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-colors group"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
                <div>
                  <div className="font-bold text-slate-700 leading-snug group-hover:text-indigo-600 transition-colors">{news.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 uppercase font-black">
                    Xem chi tiết <ExternalLink size={10}/>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* 2. BAN CHẤP HÀNH & NÚT XEM DANH SÁCH */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* DANH SÁCH BCH */}
        <div className="lg:col-span-3 bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black flex items-center gap-3 text-slate-800">
              <Award size={24} className="text-amber-500"/> Ban chấp hành lớp
            </h3>
            <button 
              onClick={() => setShowStudentList(true)}
              className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-indigo-600 transition-all shadow-lg flex items-center gap-2"
            >
              <Users size={16}/> HỒ SƠ LỚP HỌC
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bch.map((mem: any, idx: number) => (
              <div key={idx} className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 text-center group hover:bg-indigo-600 transition-all duration-300">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm mx-auto mb-3 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                   <UserCircle2 size={24}/>
                </div>
                <div className="text-[10px] font-black text-indigo-500 uppercase mb-1 group-hover:text-indigo-200">{mem.position}</div>
                <div className="font-black text-slate-800 text-sm group-hover:text-white">{mem.name}</div>
                <div className="text-[10px] text-slate-400 font-mono group-hover:text-indigo-300">{mem.idhs}</div>
              </div>
            ))}
          </div>
        </div>

        {/* THỐNG KÊ NHANH */}
        <div className="bg-rose-500 p-8 rounded-[48px] text-white shadow-xl shadow-rose-100 relative overflow-hidden">
           <div className="relative z-10">
             <h3 className="text-lg font-black mb-2 tracking-tight">Kỷ luật tuần này</h3>
             <div className="text-5xl font-black mb-4">{state.violationLogs?.length || 0}</div>
             <p className="text-rose-100 text-xs font-bold leading-relaxed">Có sự biến động nhẹ so với tuần trước. Thầy nên lưu ý!</p>
           </div>
           <div className="absolute -right-8 -bottom-8 opacity-20 transform rotate-12">
              <Activity size={150} />
           </div>
        </div>
      </div>

      {/* MODAL DANH SÁCH HỌC SINH KÈM ẢNH */}
      {showStudentList && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowStudentList(false)}></div>
          <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-[48px] shadow-2xl relative z-10 flex flex-col overflow-hidden">
            
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Hồ sơ lớp học</h2>
                <p className="text-slate-500 text-xs font-bold">Danh sách chi tiết {state.students.length} học sinh</p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                  <input 
                    type="text" 
                    placeholder="Tìm tên, mã HS..." 
                    className="pl-12 pr-6 py-3 bg-slate-100 rounded-2xl outline-none focus:ring-2 ring-indigo-500 text-sm"
                    onChange={(e) => setSearchMember(e.target.value)}
                  />
                </div>
                <button onClick={() => setShowStudentList(false)} className="p-3 bg-slate-100 rounded-2xl hover:bg-rose-100 hover:text-rose-500 transition-colors"><X size={20}/></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 custom-scrollbar">
              {state.students
                .filter((s: any) => s.name.toLowerCase().includes(searchMember.toLowerCase()) || s.idhs.includes(searchMember))
                .map((student: any, idx: number) => (
                <div key={idx} className="bg-slate-50 rounded-[32px] p-4 border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all text-center group">
                  <div className="w-full aspect-[3/4] rounded-2xl bg-slate-200 mb-4 overflow-hidden shadow-inner">
                    {student.imglink ? (
                      <img src={student.imglink} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={student.name}/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400"><UserCircle2 size={40}/></div>
                    )}
                  </div>
                  <div className="font-black text-slate-800 text-sm">{student.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">{student.idhs}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
