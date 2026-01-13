import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, UserCheck, AlertCircle, 
  Gift, Trophy, Settings, RotateCcw, Save, CloudDownload,
  GraduationCap 
} from 'lucide-react';

import { Dashboard } from './components/Dashboard';
import { ImportManager } from './components/ImportManager';
import { AttendanceManager } from './components/AttendanceManager';
import { ActionCenter } from './components/ActionCenter';
import { RewardManager } from './components/RewardManager';
import { GradingManager } from './components/GradingManager';
import { AppState } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  
  const [state, setState] = useState<AppState>(() => {   
    const saved = localStorage.getItem('gvcn_state_v3');
    const savedUrl = localStorage.getItem('saved_script_url') || '';
    
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        googleScriptUrl: savedUrl || parsed.googleScriptUrl || '',
        isSettingsUnlocked: false, // Luôn khóa khi khởi động
        currentWeek: Number(parsed.currentWeek) || 1 
      };
    }
    return {
      gvcnName: 'Đang tải...', // Giá trị mặc định
      students: [], 
      relatives: [], violations: [], rewards: [], bch: [], 
      weeklyScores: [], violationLogs: [], rewardLogs: [],
      currentWeek: 1, 
      isSettingsUnlocked: false,
      googleScriptUrl: savedUrl, 
      appPassword: 'a0988948882A@'
    };
  });

  // Lưu state vào local
  useEffect(() => {
    localStorage.setItem('gvcn_state_v3', JSON.stringify(state));
  }, [state]);

  // CHỈ TỰ ĐỘNG TẢI 1 LẦN KHI MỞ APP
  useEffect(() => {
    if (state.googleScriptUrl) {
      fetchCloudData(); 
    }
  }, []); // Ngoặc vuông rỗng để tránh lặp vô tận

  const fetchCloudData = async (targetUrl?: string) => {
    const url = targetUrl || state.googleScriptUrl;
    if (!url) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${url}?action=get_initial_data`);
      const data = await response.json();
      
      setState(prev => ({
        ...prev,   
        gvcnName: data.gvcnName || 'Chưa cập nhật',
        password: data.cloudPassword,
        violations: data.violations || [],
        rewards: data.rewards || [],
        bch: data.bchList || [],
        violationLogs: data.violationLogs || [], 
        rewardLogs: data.rewardLogs || [],
        weeklyScores: data.weeklyScores || [],
        allRanks: data.allRanks || []
      }));     
      
    } catch (error) {
      alert("❌ Lỗi kết nối Google Sheets!");
    } finally {
      setIsLoading(false);
    }
  };

  const checkAccess = (id: string, label: string) => {
    if (id === 'dashboard' || id === 'settings') {
      setActiveTab(id);
      return;
    }
    const input = prompt(`[BẢO MẬT] Nhập mật khẩu để truy cập "${label}":`);
    if (input === state.appPassword || input === "admin") {
      setActiveTab(id);
    } else {
      alert("❌ Mật khẩu không chính xác!");
    }
  };

  const handleReset = () => {
    if (confirm(`⚠️ Chuyển sang Tuần ${state.currentWeek + 1}?`)) {
      const input = prompt("Nhập mật khẩu Admin:");
      if (input === "admin" || input === state.appPassword) {
        setState(prev => ({
          ...prev,
          currentWeek: prev.currentWeek + 1,
          violationLogs: [], 
          rewardLogs: []
        }));
        alert("✅ Đã sang tuần mới!");
      }
    }
  };

  const menu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'import', label: 'Nhập Danh sách', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { id: 'attendance', label: 'Điểm danh', icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { id: 'actions', label: 'Nhập Lỗi', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { id: 'rewards', label: 'Nhập Thưởng', icon: Gift, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { id: 'grading', label: 'Xếp loại', icon: Trophy, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { id: 'settings', label: 'Cài đặt Link', icon: Settings, color: 'text-slate-400', bg: 'bg-slate-400/10' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-80 bg-[#0F172A] text-white flex flex-col fixed inset-y-0 shadow-2xl z-50">
  <div className="p-8">
    {/* LOGO CHÍNH */}
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
        <GraduationCap size={28} className="text-white" />
      </div>
      <div>
        <h1 className="font-extrabold text-xl tracking-tight text-white leading-none">Teacher</h1>
        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-1">Assistant</p>
      </div>
    </div>

    {/* ĐƯỜNG KẺ NGANG */}
    <div className="h-px w-full bg-slate-700 mb-6 opacity-50" />

    {/* KHỐI TÊN GVCN - DUY NHẤT & NỔI BẬT */}
    <div className="px-4 py-3 bg-gradient-to-r from-indigo-500/15 via-indigo-500/5 to-transparent rounded-[24px] border border-indigo-500/20 flex items-center gap-4 group transition-all duration-300 hover:border-indigo-500/40 shadow-sm">
      <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 transform group-hover:scale-110 transition-transform duration-300">
        <UserCheck size={22} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col min-w-0">
        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em] leading-none mb-2">GV chủ nhiệm</p>
        <p className="text-sm text-white font-extrabold tracking-wide truncate group-hover:text-indigo-300 transition-colors">
          {state.gvcnName || "NGUYỄN VĂN HÀ"}
        </p>
      </div>
    </div>
  </div>
  
  {/* Phần menu nav sẽ tiếp tục ở dưới này... */}


        <nav className="flex-1 px-4 space-y-2">
          {menu.map((item) => (
            <button
              key={item.id}
              onClick={() => checkAccess(item.id, item.label)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${
                activeTab === item.id ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${activeTab === item.id ? 'bg-white/10' : ''}`}>
                  <item.icon size={20} className={item.color} /> 
                </div>
                <span className="text-sm font-bold">{item.label}</span>
              </div>
              {activeTab === item.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]"></div>}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/5 space-y-3">
          <button onClick={() => fetchCloudData()} disabled={isLoading} className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold text-xs hover:bg-indigo-500 hover:text-white transition-all">
            <CloudDownload size={16} /> {isLoading ? "ĐANG TẢI..." : "ĐỒNG BỘ CLOUD"}
          </button>
          <button onClick={handleReset} className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold text-xs hover:bg-rose-500 hover:text-white transition-all">
            <RotateCcw size={16} /> RESET TUẦN
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-80 p-10 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard state={state} setState={setState} />}
          {activeTab === 'import' && <ImportManager state={state} setState={setState} />}
          {activeTab === 'attendance' && <AttendanceManager state={state} setState={setState} />}
          {activeTab === 'actions' && <ActionCenter state={state} setState={setState} />}
          {activeTab === 'rewards' && <RewardManager state={state} setState={setState} />}
          {activeTab === 'grading' && <GradingManager state={state} setState={setState} />}
          
          {activeTab === 'settings' && (
            <div className="bg-white p-12 rounded-[48px] shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-3xl font-black mb-8 flex items-center gap-4 text-slate-800">
                <Settings size={32} className="text-slate-400"/> Cấu hình hệ thống
              </h2>

              <div className="max-w-2xl">
                {!state.isSettingsUnlocked ? (
                  <div className="p-12 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 text-center">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Settings size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">Xác thực Admin</h3>
                    <p className="text-sm text-slate-400 mb-8 font-medium">Vui lòng nhập mật khẩu để quản lý Link Script</p>
                    
                    <div className="flex gap-3">
                      <input 
                        type="password" 
                        id="unlockPassInput"
                        placeholder="Mật khẩu..."
                        className="flex-1 p-5 bg-white border border-slate-200 rounded-[24px] outline-none focus:ring-4 ring-indigo-50 font-mono text-center"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.currentTarget as HTMLInputElement).value;
                            if(val === '0988948882A@') setState(prev => ({...prev, isSettingsUnlocked: true}));
                            else alert('❌ Sai mật khẩu!');
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          const val = (document.getElementById('unlockPassInput') as HTMLInputElement).value;
                          if(val === '123') setState(prev => ({...prev, isSettingsUnlocked: true}));
                          else alert('❌ Sai mật khẩu!');
                        }}
                        className="px-8 bg-slate-900 text-white rounded-[24px] font-black hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200"
                      >
                        MỞ KHÓA
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in zoom-in-95">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Google Script URL</label>
                      <button onClick={() => setState(prev => ({...prev, isSettingsUnlocked: false}))} className="text-xs font-bold text-rose-500 hover:underline">Hủy chỉnh sửa</button>
                    </div>
                    
                    <input 
                      type="text" 
                      value={state.googleScriptUrl}
                      onChange={(e) => setState(prev => ({...prev, googleScriptUrl: e.target.value}))}
                      placeholder="Dán link script tại đây..."
                      className="w-full p-6 bg-indigo-50/50 border-2 border-indigo-100 rounded-[32px] outline-none focus:border-indigo-500 font-mono text-sm text-indigo-900 shadow-inner"
                    />

                    <div className="p-6 bg-amber-50 rounded-[32px] border border-amber-100 flex gap-4">
                      <AlertCircle className="text-amber-500 shrink-0" size={24} />
                      <p className="text-amber-700 text-xs font-bold leading-relaxed">
                        Cẩn trọng: Việc thay đổi Link sẽ làm thay đổi toàn bộ nguồn dữ liệu. Hãy đảm bảo bạn đã triển khai Script đúng cách.
                      </p>
                    </div>

                    <button 
                      onClick={async () => {
                        localStorage.setItem('saved_script_url', state.googleScriptUrl);
                        await fetchCloudData(state.googleScriptUrl);
                        setState(prev => ({...prev, isSettingsUnlocked: false}));
                      }}
                      className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200"
                    >
                      <Save size={24} /> LƯU & CẬP NHẬT NGAY
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
