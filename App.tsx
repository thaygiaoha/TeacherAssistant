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
      students: [], relatives: [], violations: [], rewards: [],
      bch: [], weeklyScores: [], violationLogs: [], rewardLogs: [],
      currentWeek: 1, googleScriptUrl: savedUrl, appPassword: 'admin'
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
    { id: 'dashboard', label: 'Trung Tâm', icon: LayoutDashboard },
    { id: 'import', label: 'Nhập Danh sách', icon: Users },
    { id: 'attendance', label: 'Điểm danh', icon: UserCheck },
    { id: 'actions', label: 'Nhập Lỗi', icon: AlertCircle },
    { id: 'rewards', label: 'Nhập Thưởng', icon: Gift },
    { id: 'grading', label: 'Xếp loại', icon: Trophy },
    { id: 'settings', label: 'Cài đặt Link', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-80 bg-[#0F172A] text-white flex flex-col fixed inset-y-0 shadow-2xl z-50">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg">T</div>
            <h1 className="font-extrabold text-xl tracking-tight uppercase">Teacher Assistant</h1>
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
                ? 'bg-indigo-600 text-white shadow-xl scale-[1.02]' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon size={18} />
                <span className="text-sm font-bold">{item.label}</span>
              </div>
              <ChevronRight size={14} className={activeTab === item.id ? 'opacity-100' : 'opacity-0'} />
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
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">Mật khẩu xác thực (Admin)</label>
                  <input type="password" placeholder="Nhập mật khẩu..." id="adminPass" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] outline-none focus:border-indigo-500 font-mono text-sm transition-all" />
                </div>

                <hr className="border-slate-100" />

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">Link Google Script (Deployment URL)</label>
                  <input 
                    type="text" 
                    value={state.googleScriptUrl}
                    onChange={(e) => setState(prev => ({...prev, googleScriptUrl: e.target.value}))}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] outline-none focus:border-indigo-500 font-mono text-sm transition-all"
                  />
                </div>

                <button 
                  onClick={() => {
                    const passInput = document.getElementById('adminPass') as HTMLInputElement;
                    if(passInput.value === '123') {
                      localStorage.setItem('saved_script_url', state.googleScriptUrl);
                      fetchCloudData(state.googleScriptUrl); // Tải lại dữ liệu ngay lập tức với link mới
                    } else {
                      alert('❌ Sai mật khẩu!');
                    }
                  }}
                  className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-200"
                >
                  <Save size={20} /> LƯU & ĐỒNG BỘ NGAY
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
