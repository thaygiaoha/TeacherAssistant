import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, UserCheck, AlertCircle, 
  Trophy, Settings, CloudDownload,
  GraduationCap, RefreshCw
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
    const saved = localStorage.getItem('teacher_pro_v7');
    if (saved) return JSON.parse(saved);
    return {
      gvcnName: 'Đang tải...',
      students: [],
      relatives: [],
      violations: [],
      rewards: [],
      bchNames: [],
      newsData: [],
      newsList: [],
      violationLogs: [],
      rewardLogs: [],
      currentWeek: 1,
      googleScriptUrl: '',
      appPassword: '123',
      gradingThresholds: { tot: 100, kha: 90, dat: 80, chuaDat: 70 },
      manualRanks: []
    };
  });
  useEffect(() => {
    localStorage.setItem('teacher_pro_v7', JSON.stringify(state));
  }, [state]);

  const fetchCloudData = async () => {
    if (!state.googleScriptUrl) return alert("❌ Thầy chưa cấu hình Link Script!");
    setIsLoading(true);
    try {
      const response = await fetch(`${state.googleScriptUrl}?action=get_initial_data`);
      const data = await response.json();
      if (data) {
        setState((prev: any) => ({ ...prev, ...data }));
        alert("✅ Đã đồng bộ dữ liệu mới nhất!");
      }
    } catch (error) {
      alert("❌ Lỗi kết nối Google Sheet!");
    } finally {
      setIsLoading(false);
    }
  };
  const handleTabChange = (targetId: string) => {
  // Danh sách các ID nút bấm thầy muốn khóa mật khẩu
  // Thầy có thể thêm 'dashboard', 'attendance'... vào đây nếu muốn khóa thêm
  const protectedTabs = ['import', 'settings', 'grading', 'violation', 'attendance', 'reward'];

  if (protectedTabs.includes(targetId)) {
    const pwd = prompt("Vui lòng nhập mật khẩu quản trị:");
    if (pwd !== state.appPassword) {
      alert("❌ Mật khẩu không chính xác!");
      return; // Nếu sai mật khẩu thì dừng lại luôn, không chuyển tab
    }
  }

  // Nếu pass đúng hoặc tab không nằm trong danh sách khóa thì mới chuyển
  setActiveTab(targetId);
};
  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      {/* SIDEBAR BÊN TRÁI */}
      <aside className="w-80 bg-white border-r border-slate-100 flex flex-col relative z-20">
        <div className="p-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <GraduationCap size={28} />
            </div>
          <h1 className="text-2xl font-black tracking-tight uppercase">Assistant<span className="text-indigo-600 ml-1">Pro</span>
</h1>
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Hệ thống quản lý lớp học</p>
        </div>

        <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar pb-10">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Bảng điều khiển', color: 'text-blue-500' },
            { id: 'import', label: 'Nhập Danh sách', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
            { id: 'attendance', icon: UserCheck, label: 'Điểm danh', color: 'text-emerald-500' },
            { id: 'violation', icon: AlertCircle, label: 'Nhập lỗi vi phạm', color: 'text-rose-500' },
            { id: 'reward', icon: Trophy, label: 'Khen thưởng', color: 'text-amber-500' },
            { id: 'grading', icon: GraduationCap, label: 'Xếp loại tuần/HK', color: 'text-indigo-500' },
            { id: 'import', icon: CloudDownload, label: 'Đồng bộ dữ liệu', color: 'text-cyan-500' },
            { id: 'settings', icon: Settings, label: 'Điền link Script', color: 'text-slate-500' },
          ].map((item) => (
            <button
          key={item.id}
  // ❌ Dòng cũ: onClick={() => setActiveTab(item.id)}
  // ✅ Dòng mới:
  onClick={() => handleTabChange(item.id)} 
  
  className={`w-full flex items-center gap-4 px-6 py-5 rounded-[24px] transition-all duration-300 group ${
    activeTab === item.id 
    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 scale-[1.02]' 
    : 'text-slate-500 hover:bg-slate-50'
  }`}
>
  <item.icon size={22} className={`${activeTab === item.id ? 'text-white' : item.color} transition-colors`} />
  <span className="font-black text-xs uppercase tracking-wider">{item.label}</span>
</button>
          ))}

          <div className="pt-10 mt-10 border-t border-slate-100">
            <button
  onClick={async () => {
    // 1. Xác nhận lần đầu
    const confirmReset = window.confirm("⚠️ Thầy có chắc chắn muốn XÓA SẠCH dữ liệu từ hàng 2 cột C trở đi trên Cloud không?");
    if (!confirmReset) return;

    // 2. Yêu cầu mật khẩu (Lấy từ state.appPassword thầy đã cài đặt)
    const password = window.prompt("🔑 Nhập mật khẩu xác nhận:");
    if (password !== state.appPassword) {
      alert("❌ Mật khẩu không đúng, thao tác đã bị hủy!");
      return;
    }

    // 3. Tiến hành gọi API xóa
    setIsLoading(true);
    try {
      const response = await fetch(`${state.googleScriptUrl}?action=reset_week`);
      // Lưu ý: Nếu Google báo lỗi CORS nhưng thực tế trên Sheet đã xóa thì vẫn coi là thành công
      const result = await response.json();
      
      if (result.status === "success") {
        alert("✅ Thành công! Toàn bộ dữ liệu từ cột C đã được dọn sạch.");
        // Làm mới lại dữ liệu hiển thị trên App
        window.location.reload(); 
      }
    } catch (error) {
      // Đôi khi Google thực hiện xong nhưng trả về lỗi kết nối mạng (CORS)
      // Thầy hãy kiểm tra trực tiếp trên Sheet nhé
      alert("⚠️ Đã gửi lệnh xóa. Thầy hãy kiểm tra lại file Google Sheet xem vùng dữ liệu hàng 2, cột C đã trống chưa nhé!");
    } finally {
      setIsLoading(false);
    }
  }}
  className="w-full flex items-center gap-4 px-6 py-5 rounded-[24px] transition-all bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white group"
>
  <RefreshCw size={22} className="group-hover:animate-spin" />
  <div className="text-left">
    <span className="block font-black text-[10px] uppercase tracking-widest">Reset tuần</span>
    <span className="block text-[8px] font-bold opacity-60 italic">Xóa Cloud (Cần Pass)</span>
  </div>
</button>
          </div>
        </nav>
      </aside>

      {/* NỘI DUNG CHÍNH */}
      <main className="flex-1 overflow-y-auto bg-[#F8FAFC] relative custom-scrollbar">
        <div className="max-w-[1600px] mx-auto p-12 pb-32">
          {activeTab === 'dashboard' && <Dashboard state={state} setState={setState} setActiveTab={setActiveTab} />}
          {activeTab === 'import' && <ImportManager state={state} setState={setState} />}
          {activeTab === 'attendance' && <AttendanceManager state={state} />}
          {activeTab === 'violation' && <ActionCenter state={state} setState={setState} />}
          {activeTab === 'reward' && <RewardManager state={state} setState={setState} />}         
          {activeTab === 'grading' && <GradingManager state={state} setState={setState} />}
          {activeTab === 'settings' && (
            <div className="bg-white p-12 rounded-[56px] shadow-sm border border-slate-100 space-y-8 animate-in slide-in-from-bottom-10">
              <div className="flex items-center gap-4">
                <Settings className="text-indigo-600" size={32}/>
                <h2 className="text-3xl font-black uppercase tracking-tighter">Cấu hình kết nối</h2>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Google Apps Script URL</label>
                <input 
                  type="text" 
                  value={state.googleScriptUrl} 
                  onChange={(e) => setState((prev: any) => ({...prev, googleScriptUrl: e.target.value}))}
                  placeholder="Dán link script vào đây..."
                  className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[30px] outline-none focus:border-indigo-500 font-bold text-slate-700"
                />
              </div>
              <button onClick={() => fetchCloudData()} className="w-full py-6 bg-slate-900 text-white rounded-[30px] font-black uppercase text-sm shadow-xl active:scale-95 transition-all hover:bg-indigo-600">
                Lưu và Đồng bộ ngay
              </button>
            </div>
          )}
        </div>
      </main>
      
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[200] flex items-center justify-center flex-col gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black text-xs uppercase tracking-widest text-indigo-600">Đang tải dữ liệu...</p>
        </div>
      )}
    </div>
  );
}
