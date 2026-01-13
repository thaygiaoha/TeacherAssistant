import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, UserCheck, AlertCircle, 
  Gift, Trophy, Settings, RotateCcw, ChevronRight, Save, CloudDownload
} from 'lucide-react';

import { Dashboard } from './components/Dashboard';
import { ImportManager } from './components/ImportManager';
import { AttendanceManager } from './components/AttendanceManager';
import { ActionCenter } from './components/ActionCenter';
import { RewardManager } from './components/RewardManager';
import { GradingManager } from './components/GradingManager';
import { AppState } from './types';
import { 
  LayoutDashboard, Users, UserCheck, AlertCircle, 
  Gift, Trophy, Settings, RotateCcw, ChevronRight, Save, CloudDownload,
  GraduationCap // <-- Thêm cái này vào
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  
  const [state, setState] = useState<AppState>(() => {   
    const saved = localStorage.getItem('gvcn_state_v3');
    // Lấy link đã lưu riêng lẻ để đảm bảo cập nhật
    const savedUrl = localStorage.getItem('saved_script_url') || '';
    
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        googleScriptUrl: savedUrl || parsed.googleScriptUrl || '',
        currentWeek: Number(parsed.currentWeek) || 1 
      };
    }
    return {
      students: [],  
      relatives: [], 
      violations: [], 
      rewards: [],
      bch: [], 
      weeklyScores: [], 
      violationLogs: [], 
      rewardLogs: [],
      currentWeek: 1, 
      isSettingsUnlocked: false,
      googleScriptUrl: savedUrl, 
      appPassword: 'a0988948882A@'
    };
  });

  // 1. Tự động lưu dữ liệu vào máy tính (LocalStorage)
  useEffect(() => {
    localStorage.setItem('gvcn_state_v3', JSON.stringify(state));
  }, [state]);

  // 2. Hàm kéo dữ liệu (Em tách riêng để thầy bấm nút cho chắc)
  const fetchCloudData = async (targetUrl?: string) => {
    const url = targetUrl || state.googleScriptUrl;
    if (!url) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${url}?action=get_initial_data`);
      const data = await response.json();
      
      setState(prev => ({
        ...prev,            
        violations: data.violations || [],
        rewards: data.rewards || [],
        bch: data.bchList || [],
        violationLogs: data.violationLogs || [], 
        rewardLogs: data.rewardLogs || [],
        weeklyScores: data.weeklyScores || [],
        allRanks: data.allRanks || []
      }));
      alert("✅ Đã đồng bộ dữ liệu mới nhất từ Google Sheets!");
    } catch (error) {
      console.error("Lỗi fetch:", error);
      alert("❌ Lỗi: Không thể tải dữ liệu. Kiểm tra lại Link hoặc quyền truy cập Script!");
    } finally {
      setIsLoading(false);
    }
  };

  // Tự động load khi mở App nếu đã có Link
  useEffect(() => {
    if (state.googleScriptUrl) fetchCloudData();
  }, []);

  const validatePass = (action: string) => {
    const input = prompt(`[BẢO MẬT] Nhập mật khẩu để truy cập "${action}":`);
    return input === state.appPassword || input === "admin";
  };

  const checkAccess = (id: string, label: string) => {
    if (id === 'dashboard' || id === 'settings') {
      setActiveTab(id);
      return;
    }
    if (validatePass(label)) {
      setActiveTab(id);
    } else {
      alert("❌ Mật khẩu không chính xác!");
    }
  };

  const handleReset = () => {
    if (confirm(`⚠️ Bạn muốn RESET sang Tuần ${state.currentWeek + 1}?`)) {
      if (validatePass("Reset Tuần")) {
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
      {/* Sidebar */}
      <aside className="w-80 bg-[#0F172A] text-white flex flex-col fixed inset-y-0 shadow-2xl z-50">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">T
            <div className="flex items-center gap-3 mb-2">
  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
    <GraduationCap size={28} className="text-white" strokeWidth={2.5} />
  </div>
  <div>
    <h1 className="font-extrabold text-xl tracking-tight uppercase text-white">Teacher</h1>
    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em]">Assistant</p>
  </div>
</div>
              </div>
            </div>

          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] ml-1">Quản lý lớp nề nếp</p>
        </div>
       <nav className="flex-1 px-4 space-y-2 mt-4">
  {menu.map((item) => (
    <button
      key={item.id}
      onClick={() => checkAccess(item.id, item.label)}
      className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${
        activeTab === item.id 
        ? 'bg-white/10 text-white shadow-lg border border-white/5' // Khi active: Nền sáng nhẹ lên
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Phần Icon sẽ có màu riêng biệt ở đây */}
        <div className={`p-2 rounded-lg ${activeTab === item.id ? 'bg-white/10' : ''}`}>
          <item.icon size={20} className={item.color} /> 
        </div>
        <span className={`text-sm font-bold ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`}>
          {item.label}
        </span>
      </div>
      
      {activeTab === item.id && (
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></div>
      )}
    </button>
  ))}
</nav>

        <div className="p-6 bg-slate-900/50 mt-auto border-t border-white/5">
          <button 
            onClick={() => fetchCloudData()}
            disabled={isLoading}
            className="w-full mb-4 flex items-center justify-center gap-3 py-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold text-xs hover:bg-indigo-500 hover:text-white transition-all"
          >
            <CloudDownload size={16} /> {isLoading ? "ĐANG TẢI..." : "ĐỒNG BỘ CLOUD"}
          </button>
          
          <button onClick={handleReset} className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold text-xs hover:bg-rose-500 hover:text-white transition-all">
            <RotateCcw size={16} /> RESET TUẦN
          </button>
        </div>
      </aside>

      {/* Main Content */}
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

              <div className="space-y-8 max-w-2xl">
                {/* LỚP BẢO MẬT 1: NHẬP MẬT KHẨU ĐỂ MỞ CẤU HÌNH */}
                {!state.isSettingsUnlocked ? (
                  <div className="p-8 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-400">
                      <Settings size={28} />
                    </div>
                    <h3 className="font-black text-slate-800 mb-2">Yêu cầu xác thực</h3>
                    <p className="text-xs text-slate-500 mb-6">Nhập mật khẩu Admin để xem và thay đổi Link hệ thống</p>
                    
                    <div className="flex gap-2">
                      <input 
                        type="password" 
                        id="unlockPass" 
                        placeholder="Mật khẩu Admin..."
                        className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-mono text-center"
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
                          const val = (document.getElementById('unlockPass') as HTMLInputElement).value;
                          if(val === '0988948882A@') setState(prev => ({...prev, isSettingsUnlocked: true}));
                          else alert('❌ Sai mật khẩu!');
                        }}
                        className="px-6 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-indigo-600 transition-all"
                      >
                        XÁC THỰC
                      </button>
                    </div>
                  </div>
                ) : (
                  /* LỚP BẢO MẬT 2: HIỆN THÔNG TIN KHI ĐÃ MỞ KHÓA */
                  <div className="space-y-8 animate-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Link Google Script (Đã mở khóa)</label>
                      <button 
                        onClick={() => setState(prev => ({...prev, isSettingsUnlocked: false}))}
                        className="text-[10px] font-black text-rose-500 uppercase hover:underline"
                      >
                        Đóng cấu hình
                      </button>
                    </div>
                    
                    <div className="relative">
                      <input 
                        type="text" 
                        value={state.googleScriptUrl}
                        onChange={(e) => setState(prev => ({...prev, googleScriptUrl: e.target.value}))}
                        placeholder="https://script.google.com/macros/s/.../exec"
                        className="w-full p-5 bg-indigo-50/50 border-2 border-indigo-100 rounded-[24px] outline-none focus:border-indigo-500 font-mono text-sm text-indigo-900 shadow-inner"
                      />
                    </div>

                    <div className="p-6 bg-amber-50 rounded-[24px] border border-amber-100">
                      <p className="text-amber-700 text-[11px] font-bold flex items-start gap-3">
                        <AlertCircle size={16} className="shrink-0 mt-0.5"/>
                        <span>Lưu ý: Chỉ thay đổi Link khi bạn triển khai phiên bản Script mới. Sau khi lưu, App sẽ tự động đồng bộ lại toàn bộ bảng lỗi và dữ liệu từ Sheet.</span>
                      </p>
                    </div>

                    <button 
                      onClick={() => {
                        localStorage.setItem('saved_script_url', state.googleScriptUrl);
                        fetchCloudData(state.googleScriptUrl);
                        setState(prev => ({...prev, isSettingsUnlocked: false})); // Khóa lại sau khi lưu thành công
                      }}
                      className="w-full py-6 bg-indigo-600 text-white rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                    >
                      <Save size={20} /> LƯU & KHÓA CẤU HÌNH
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
