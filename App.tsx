import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, UserCheck, AlertCircle, 
  Gift, Trophy, Settings, RotateCcw, ChevronRight
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
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        currentWeek: Number(parsed.currentWeek) || 1 
      };
    }
    return {
      students: [],
      relatives: [],
      violations: [], // Bảng lỗi sẽ được load từ Sheet
      rewards: [],
      bch: [],
      weeklyScores: [],
      violationLogs: [],
      rewardLogs: [],
      currentWeek: 1,
      googleScriptUrl: '',
      appPassword: 'admin'
    };
  });

  // 1. Tự động lưu dữ liệu vào máy tính
  useEffect(() => {
    localStorage.setItem('gvcn_state_v3', JSON.stringify(state));
  }, [state]);

  // 2. TỰ ĐỘNG LOAD BẢNG LỖI KHI MỞ APP (Quan trọng nhất)
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!state.googleScriptUrl) return;
      setIsLoading(true);
      try {
        const response = await fetch(`${state.googleScriptUrl}?action=get_initial_data`);
        const data = await response.json();
        if (data.violations) {
          setState(prev => ({
            ...prev,            
            violations: data.violations || [], // Cập nhật bảng lỗi vào state
            rewards: data.rewards || [],     // <--- Lưu danh sách thưởng
            bch: data.bchList || [],            // <--- Lưu danh sách BCH
            violationLogs: data.violationLogs || [], 
            rewardLogs: data.rewardLogs || [],
            weeklyScores: data.weeklyScores || [],
            allRanks: data.allRanks || []
          }));
        }
      } catch (error) {
        console.error("Không thể tải bảng lỗi:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [state.googleScriptUrl]); // Chạy khi Link Script thay đổi hoặc mở App

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
          // Giữ lại bảng lỗi (violations), chỉ xóa log ghi chép
          violationLogs: prev.violationLogs.map(l => ({ ...l, v_logs: {} })),
          rewardLogs: prev.rewardLogs.map(l => ({ ...l, t_logs: {} }))
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
      {/* Sidebar (Giữ nguyên giao diện đẹp của thầy) */}
      <aside className="w-80 bg-[#0F172A] text-white flex flex-col fixed inset-y-0 shadow-2xl z-50">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">T</div>
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
          <div className="bg-slate-800 rounded-2xl p-4 mb-4 border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase">Tiến độ Học kỳ</span>
              <span className="text-indigo-400 font-black text-sm">Tuần {state.currentWeek}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{width: `${(state.currentWeek/18)*100}%`}}></div>
            </div>
          </div>
          <button 
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 font-black text-xs hover:bg-rose-500 hover:text-white transition-all shadow-lg"
          >
            <RotateCcw size={16} /> RESET TUẦN MỚI
          </button>
        </div>
      </aside>

      {/* Main Content */}
      {activeTab === 'settings' && (
            <div className="bg-white p-12 rounded-[48px] shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-3xl font-black mb-8 flex items-center gap-4">
                <div className="p-3 bg-slate-100 rounded-2xl text-slate-500"><Settings size={28}/></div>
                Cấu hình hệ thống
              </h2>
              
              <div className="space-y-8 max-w-2xl">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">Mật khẩu xác thực (Admin)</label>
                  <input 
                    type="password" 
                    placeholder="Nhập mật khẩu để chỉnh sửa..."
                    id="adminPass"
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] outline-none focus:border-indigo-500 font-mono text-sm transition-all shadow-inner"
                  />
                </div>

                <hr className="border-slate-100" />

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">Link Google Script (Deployment URL)</label>
                  <input 
                    type="text" 
                    value={state.googleScriptUrl}
                    onChange={(e) => setState(prev => ({...prev, googleScriptUrl: e.target.value}))}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] outline-none focus:border-indigo-500 font-mono text-sm transition-all shadow-inner"
                  />
                </div>

                <div className="p-6 bg-amber-50 rounded-[24px] border border-amber-100">
                  <p className="text-amber-700 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={14}/> Quan trọng: Mọi thay đổi về Link sẽ ảnh hưởng trực tiếp đến việc đồng bộ dữ liệu.
                  </p>
                </div>

                <button 
                  onClick={() => {
                    const passInput = document.getElementById('adminPass') as HTMLInputElement;
                    if(passInput.value === '123') {
                      localStorage.setItem('saved_script_url', state.googleScriptUrl);
                      alert('✅ Đã lưu cấu hình hệ thống thành công!');
                    } else {
                      alert('❌ Mật khẩu admin không đúng!');
                    }
                  }}
                  className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
                >
                  <Save size={20} /> LƯU CẤU HÌNH
                </button>
              </div>
            </div>
          )}
        </div>
     
    </div>
  );
};
