import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Camera, LayoutDashboard, Settings, Plus, Leaf, Target, Truck, Calendar, Trophy, ArrowUpCircle, History, ChevronRight, Download, FileSpreadsheet, Cloud, Link as LinkIcon, CheckCircle2, RefreshCw } from 'lucide-react';
import { CaneTicket, QuotaSettings, AppView, GoalHistory } from './types';
import { Scanner } from './components/Scanner';
import { RecordList } from './components/RecordList';
import { SummaryCard } from './components/SummaryCard';
import { syncToGoogleSheets, fetchFromGoogleSheets } from './services/googleSheetsService';

// Color Palette
const COLORS_PROGRESS = ['#10B981', '#E5E7EB']; // Green, Gray
const COLORS_SUCCESS = ['#FBBF24', '#FBBF24']; // Gold

// Default Google Apps Script URL provided by user
const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbym2WrMT6N-BVAoCTyN9aIK1hcGlQBcL5FsiSKwTWq90VwFX0yaG5AnicmQamvK2vo/exec";

const App: React.FC = () => {
  // State
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [records, setRecords] = useState<CaneTicket[]>([]);
  // Initialize with new structure, provide fallback for existing data
  const [quota, setQuota] = useState<QuotaSettings>({ 
    targetTons: 1000, 
    currentGoalStartDate: 0, 
    history: [],
    googleScriptUrl: DEFAULT_SCRIPT_URL
  });
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [showNextGoalModal, setShowNextGoalModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load data on mount
  useEffect(() => {
    const savedRecords = localStorage.getItem('caneRecords');
    const savedQuota = localStorage.getItem('caneQuota');
    
    let currentScriptUrl = DEFAULT_SCRIPT_URL;

    if (savedQuota) {
      const parsedQuota = JSON.parse(savedQuota);
      // Migration: If url is missing or empty, use the default provided by user
      currentScriptUrl = (parsedQuota.googleScriptUrl && parsedQuota.googleScriptUrl.trim() !== "") 
        ? parsedQuota.googleScriptUrl 
        : DEFAULT_SCRIPT_URL;

      setQuota({
        targetTons: parsedQuota.targetTons || 1000,
        currentGoalStartDate: parsedQuota.currentGoalStartDate || 0,
        history: parsedQuota.history || [],
        googleScriptUrl: currentScriptUrl
      });
    } else {
      // New user setup
      setQuota(prev => ({ ...prev, googleScriptUrl: DEFAULT_SCRIPT_URL }));
    }

    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }

    // Auto-fetch latest data from Google Sheets on startup
    if (currentScriptUrl) {
      handleFetchData(currentScriptUrl, true); // true = silent mode (no alert on error)
    }
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem('caneRecords', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('caneQuota', JSON.stringify(quota));
  }, [quota]);

  // --- Calculations ---

  // 1. Current Goal Progress (Only records after start date)
  const currentGoalRecords = useMemo(() => 
    records.filter(r => r.timestamp >= quota.currentGoalStartDate), 
  [records, quota.currentGoalStartDate]);

  const currentGoalWeightKg = useMemo(() => 
    currentGoalRecords.reduce((sum, r) => sum + r.netWeightKg, 0), 
  [currentGoalRecords]);

  const currentGoalWeightTons = currentGoalWeightKg / 1000;
  
  // 2. Lifetime Stats
  const lifetimeWeightKg = useMemo(() => records.reduce((sum, r) => sum + r.netWeightKg, 0), [records]);
  const lifetimeWeightTons = lifetimeWeightKg / 1000;

  // 3. Percentages & Status
  const percentage = Math.min(100, Math.max(0, (currentGoalWeightTons / quota.targetTons) * 100));
  const remainingTons = Math.max(0, quota.targetTons - currentGoalWeightTons);
  const isGoalAchieved = currentGoalWeightTons >= quota.targetTons;
  const currentRound = quota.history.length + 1;

  const chartData = [
    { name: 'Achieved', value: currentGoalWeightTons },
    { name: 'Remaining', value: remainingTons },
  ];

  // --- Handlers ---

  const handleFetchData = async (url: string, silent: boolean = false) => {
    setIsLoading(true);
    try {
      const cloudRecords = await fetchFromGoogleSheets(url);
      
      if (cloudRecords === null) {
          // Error case
          if (!silent) {
            alert("⚠️ ไม่สามารถดึงข้อมูลจาก Google Sheets ได้\n\nสาเหตุที่เป็นไปได้:\n1. ยังไม่ได้ตั้งสิทธิ์ 'Anyone' (ทุกคน) ตอน Deploy\n2. Script Error: หากสร้าง Script แบบ Standalone (ไม่ได้สร้างผ่าน Google Sheet) คำสั่ง getActiveSpreadsheet() จะใช้ไม่ได้\n3. URL ไม่ถูกต้อง");
          }
      } else if (cloudRecords.length > 0) {
        // Success case with data
        setRecords(cloudRecords);
        console.log(`Loaded ${cloudRecords.length} records from cloud`);
        if (!silent) alert(`ดึงข้อมูลสำเร็จ ${cloudRecords.length} รายการ`);
      } else {
        // Success case but empty
        console.log("Connect success, but no records found.");
        if (!silent) alert("เชื่อมต่อสำเร็จ แต่ยังไม่มีข้อมูลในตาราง");
      }
    } catch (e) {
      console.error("Failed to fetch data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRecord = async (newTicket: CaneTicket) => {
    // 1. Save locally first (Instant UI update)
    setRecords(prev => [...prev, newTicket]);
    setView(AppView.DASHBOARD);

    // 2. Sync to Google Sheets if URL is present
    const scriptUrl = quota.googleScriptUrl || DEFAULT_SCRIPT_URL;
    
    if (scriptUrl) {
      setIsSyncing(true);
      // Use setTimeout to not block the UI render
      setTimeout(async () => {
        try {
          const success = await syncToGoogleSheets(scriptUrl, newTicket);
          if (success) {
            console.log("Synced to Google Sheets successfully");
            // Optional: Re-fetch to confirm consistency if needed, but might be slow
          } else {
            console.warn("Sync completed with potential issues");
          }
        } catch (e) {
          console.error("Sync failed", e);
          // Optional: Add a subtle notification
        } finally {
          setIsSyncing(false);
        }
      }, 500);
    }
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    // Note: This only deletes locally. Deleting from Google Sheets requires more complex API logic.
    alert("ลบข้อมูลออกจากเครื่องแล้ว (ข้อมูลใน Google Sheets จะยังคงอยู่)");
  };

  const updateCurrentQuota = (newTarget: number, newScriptUrl: string) => {
    setQuota(prev => ({ 
      ...prev, 
      targetTons: newTarget,
      googleScriptUrl: newScriptUrl
    }));
    setShowQuotaModal(false);
    
    // If URL changed, try to fetch data
    if (newScriptUrl && newScriptUrl !== quota.googleScriptUrl) {
      handleFetchData(newScriptUrl);
    }
  };

  const handleStartNextGoal = (newTarget: number) => {
    const completedGoal: GoalHistory = {
      round: currentRound,
      targetTons: quota.targetTons,
      achievedTons: currentGoalWeightTons,
      completedDate: new Date().toLocaleDateString('th-TH'),
      timestamp: Date.now()
    };

    setQuota(prev => ({
      ...prev,
      targetTons: newTarget,
      currentGoalStartDate: Date.now(),
      history: [completedGoal, ...prev.history] // Add to history (newest first)
    }));
    
    setShowNextGoalModal(false);
  };

  const handleExportCSV = () => {
    if (records.length === 0) {
      alert("ไม่มีข้อมูลให้ส่งออก");
      return;
    }

    // Define Headers
    const headers = [
      "วันที่",
      "เวลา",
      "เลขที่ใบชั่ง",
      "ทะเบียนรถ",
      "ลูกค้า/ชาวไร่",
      "สินค้า",
      "น้ำหนักสุทธิ (กก.)",
      "น้ำหนักรวม (กก.)",
      "น้ำหนักรถ (กก.)"
    ];

    // Map Data
    const rows = records.map(r => [
      r.date,
      r.time,
      `"${r.ticketNumber}"`, // Quote to prevent auto-formatting
      `"${r.licensePlate}"`,
      `"${r.vendorName}"`,
      r.productName,
      r.netWeightKg,
      r.grossWeightKg || 0,
      r.tareWeightKg || 0
    ]);

    // Create CSV Content with BOM for Thai support in Excel
    const csvContent = "\uFEFF" + 
      [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    // Create Download Link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `cane_tracking_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Render Views ---

  const renderContent = () => {
    if (view === AppView.SCANNER) {
      return (
        <Scanner 
          onSave={handleSaveRecord} 
          onCancel={() => setView(AppView.DASHBOARD)} 
        />
      );
    }

    return (
      <div className="p-4 space-y-6 pb-24 max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Leaf className="text-green-600 fill-green-600" />
              <span>CaneTrack AI</span>
              {isSyncing && <span className="text-xs text-blue-500 animate-pulse font-normal">(กำลังส่ง...)</span>}
            </h1>
            <p className="text-sm text-gray-500">
              รวมทั้งหมด: {lifetimeWeightTons.toLocaleString()} ตัน
              {isLoading && <span className="ml-2 inline-block animate-spin text-green-600">⌛</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleFetchData(quota.googleScriptUrl || DEFAULT_SCRIPT_URL)}
              className={`p-2 rounded-full ${isLoading ? 'animate-spin bg-green-50 text-green-600' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
              title="รีเฟรชข้อมูลจาก Cloud"
            >
              <RefreshCw size={20} />
            </button>
            <button 
              onClick={() => setShowQuotaModal(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <Settings size={24} />
            </button>
          </div>
        </div>

        {/* Dashboard Card */}
        <div className={`rounded-2xl p-6 shadow-sm border relative overflow-hidden transition-all duration-500 ${isGoalAchieved ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-8 -mt-8 opacity-50 z-0 ${isGoalAchieved ? 'bg-amber-200' : 'bg-green-50'}`}></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center space-x-2 mb-2 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm">
               <Target size={14} className={isGoalAchieved ? 'text-amber-600' : 'text-green-600'} />
               <span className={`text-xs font-bold uppercase ${isGoalAchieved ? 'text-amber-700' : 'text-green-700'}`}>เป้าหมายที่ {currentRound}</span>
            </div>

            {isGoalAchieved && (
              <div className="absolute top-4 left-4 animate-bounce">
                <Trophy className="text-amber-500 fill-amber-500 drop-shadow-sm" size={32} />
              </div>
            )}
            
            <div className="w-48 h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={isGoalAchieved ? COLORS_SUCCESS[index % COLORS_SUCCESS.length] : COLORS_PROGRESS[index % COLORS_PROGRESS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isGoalAchieved ? (
                   <>
                     <span className="text-3xl font-bold text-amber-600">สำเร็จ!</span>
                     <span className="text-xs text-amber-600/70 uppercase tracking-wider">ผ่านเป้าหมาย</span>
                   </>
                ) : (
                   <>
                     <span className="text-3xl font-bold text-green-700">{percentage.toFixed(1)}%</span>
                     <span className="text-xs text-gray-400 uppercase tracking-wider">ความคืบหน้า</span>
                   </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 w-full mt-4 text-center">
              <div>
                <p className="text-xs text-gray-400 uppercase mb-1">เป้าหมาย (ตัน)</p>
                <p className="text-xl font-bold text-gray-800">{quota.targetTons.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase mb-1">ส่งแล้ว (ตัน)</p>
                <p className={`text-xl font-bold ${isGoalAchieved ? 'text-amber-600' : 'text-green-600'}`}>{currentGoalWeightTons.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            {isGoalAchieved && (
              <button 
                onClick={() => setShowNextGoalModal(true)}
                className="mt-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-amber-200 flex items-center gap-2 hover:scale-105 transition-transform animate-pulse"
              >
                <ArrowUpCircle size={20} />
                <span>เริ่มเป้าหมายถัดไป</span>
              </button>
            )}
          </div>
        </div>

        {/* Goal History Section */}
        {quota.history.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
             <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
               <History size={16} />
               <span>ความสำเร็จที่ผ่านมา</span>
             </h3>
             <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {quota.history.map((h, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm min-w-[140px] flex-shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1">
                      <Trophy size={12} className="text-amber-300" />
                    </div>
                    <div className="text-xs text-gray-400 mb-1">เป้าหมายที่ {h.round}</div>
                    <div className="font-bold text-amber-600 text-lg">{h.achievedTons.toLocaleString()} ตัน</div>
                    <div className="text-[10px] text-gray-400 mt-1">{h.completedDate}</div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard 
            title="เที่ยววันนี้" 
            value={currentGoalRecords.filter(r => r.date === new Date().toLocaleDateString('th-TH')).length.toString()} 
            icon={Truck}
            color="blue"
          />
           <SummaryCard 
            title={isGoalAchieved ? "เกินเป้า (ตัน)" : "เหลืออีก (ตัน)"}
            value={(isGoalAchieved ? (currentGoalWeightTons - quota.targetTons) : remainingTons).toLocaleString(undefined, { maximumFractionDigits: 1 })} 
            icon={Target}
            color={isGoalAchieved ? "green" : "amber"}
          />
        </div>

        {/* Recent Records (All time) */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold text-gray-800">รายการล่าสุด</h2>
            <div className="flex items-center gap-2">
               <span className="text-xs text-gray-500">รวมทั้งหมด {records.length} รายการ</span>
            </div>
          </div>
          <RecordList records={records} onDelete={handleDeleteRecord} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {renderContent()}

      {/* Floating Action Button for Scan */}
      {view === AppView.DASHBOARD && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
          <button 
            onClick={() => setView(AppView.SCANNER)}
            className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg shadow-green-300 transform transition-transform active:scale-95 flex items-center justify-center pointer-events-auto"
          >
            <Plus size={32} />
          </button>
        </div>
      )}

      {/* Settings / Quota Modal */}
      {showQuotaModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Settings size={20} className="text-gray-600" />
              <span>การตั้งค่า</span>
            </h3>

            {/* Quota Section */}
            <div className="mb-6">
                <label className="block text-sm text-gray-600 mb-2 font-medium">เป้าหมายปัจจุบัน (ตัน)</label>
                <input 
                  type="number" 
                  defaultValue={quota.targetTons}
                  className="w-full border border-gray-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-green-500 outline-none mb-4"
                  id="quotaInput"
                />

                <label className="block text-sm text-gray-600 mb-2 font-medium flex items-center gap-2">
                  <Cloud size={16} />
                  <span>Google Apps Script URL</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">ใส่ Web App URL เพื่อซิงค์ข้อมูลลง Google Sheets</p>
                <div className="flex items-center gap-2 mb-4 bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <LinkIcon size={16} className="text-gray-400 min-w-[16px]" />
                  <input 
                    type="text" 
                    defaultValue={quota.googleScriptUrl || DEFAULT_SCRIPT_URL}
                    placeholder="https://script.google.com/macros/s/..."
                    className="w-full bg-transparent outline-none text-sm text-gray-600"
                    id="scriptUrlInput"
                  />
                  {quota.googleScriptUrl && <CheckCircle2 size={16} className="text-green-500" />}
                </div>

                <button 
                    onClick={() => {
                    const val = document.getElementById('quotaInput') as HTMLInputElement;
                    const urlVal = document.getElementById('scriptUrlInput') as HTMLInputElement;
                    updateCurrentQuota(Number(val.value), urlVal.value);
                    }}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-sm hover:bg-green-700"
                >
                    บันทึกการตั้งค่า
                </button>
            </div>

            <hr className="border-gray-100 my-4" />

            {/* Data Management Section */}
            <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-green-600" />
                    จัดการข้อมูล
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                    ส่งออกข้อมูลทั้งหมดเป็นไฟล์ CSV เพื่อนำไปเปิดใน Excel หรือ Google Sheets
                </p>
                <button 
                    onClick={handleExportCSV}
                    className="w-full bg-white border border-green-200 text-green-700 hover:bg-green-50 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                    <Download size={18} />
                    <span>ส่งออกข้อมูล (Excel/CSV)</span>
                </button>
            </div>
            
            <button 
              onClick={() => setShowQuotaModal(false)}
              className="w-full py-3 text-gray-400 font-medium hover:bg-gray-100 rounded-xl"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* Next Goal Modal */}
      {showNextGoalModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
            
            <div className="text-center mb-6">
                <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Trophy className="text-amber-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">ยินดีด้วย!</h3>
                <p className="text-sm text-gray-500">คุณทำสำเร็จตามเป้าหมายที่ {currentRound} แล้ว</p>
                <div className="mt-2 text-2xl font-bold text-amber-600">{currentGoalWeightTons.toLocaleString()} ตัน</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2 text-center">ตั้งเป้าหมายสำหรับรอบใหม่ (ตัน)</label>
                <input 
                type="number" 
                defaultValue={1000}
                className="w-full bg-white border border-gray-300 rounded-lg p-3 text-2xl mb-2 focus:ring-2 focus:ring-amber-500 outline-none text-center font-bold text-gray-800"
                id="nextGoalInput"
                />
                <p className="text-xs text-gray-400 text-center">ระบบจะเริ่มนับความคืบหน้าใหม่สำหรับรอบนี้</p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowNextGoalModal(false)}
                className="flex-1 py-3 text-gray-500 font-medium hover:bg-gray-100 rounded-xl"
              >
                ไว้ทีหลัง
              </button>
              <button 
                onClick={() => {
                  const val = document.getElementById('nextGoalInput') as HTMLInputElement;
                  handleStartNextGoal(Number(val.value));
                }}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
              >
                เริ่มเป้าหมายใหม่
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;