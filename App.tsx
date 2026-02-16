import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Camera, Settings, Plus, Leaf, Target, Truck, Trophy, ArrowUpCircle, History, Download, FileSpreadsheet, Cloud, CheckCircle2, RefreshCw, Coins } from 'lucide-react';
import { CaneTicket, QuotaSettings, AppView, GoalHistory } from './types';
import { Scanner } from './components/Scanner';
import { RecordList } from './components/RecordList';
import { SummaryCard } from './components/SummaryCard';
import { EditModal } from './components/EditModal';
import { syncToGoogleSheets, fetchFromGoogleSheets, deleteFromGoogleSheets } from './services/googleSheetsService';

// Color Palette
const COLORS_PROGRESS = ['#10B981', '#E5E7EB']; // Green, Gray
const COLORS_SUCCESS = ['#FBBF24', '#FBBF24']; // Gold

// --- Price Table Logic ---
const calculateCanePrice = (moisture: number): number => {
    if (moisture <= 20.00) return 900;
    if (moisture <= 21.00) return 889;
    if (moisture <= 22.00) return 877;
    if (moisture <= 23.00) return 865;
    if (moisture <= 24.00) return 853;
    if (moisture <= 25.00) return 840;
    if (moisture <= 26.00) return 827;
    if (moisture <= 27.00) return 814;
    if (moisture <= 28.00) return 800;
    if (moisture <= 29.00) return 786;
    if (moisture <= 30.00) return 771;
    if (moisture <= 31.00) return 757;
    if (moisture <= 32.00) return 741;
    if (moisture <= 33.00) return 725;
    if (moisture <= 34.00) return 709;
    if (moisture <= 35.00) return 692;
    if (moisture <= 36.00) return 675;
    if (moisture <= 37.00) return 657;
    if (moisture <= 38.00) return 639;
    if (moisture <= 39.00) return 620;
    if (moisture <= 40.00) return 600;
    if (moisture <= 41.00) return 580;
    return 0; // Too high moisture
};

const App: React.FC = () => {
  // State with Lazy Initialization
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  
  const [records, setRecords] = useState<CaneTicket[]>(() => {
    const saved = localStorage.getItem('caneRecords');
    return saved ? JSON.parse(saved) : [];
  });

  const [quota, setQuota] = useState<QuotaSettings>(() => {
    const saved = localStorage.getItem('caneQuota');
    const defaultSettings = { 
        targetTons: 1000, 
        currentGoalStartDate: 0, 
        history: []
    };

    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            return { ...defaultSettings, ...parsed };
        } catch (e) {
            console.error("Error parsing saved quota settings", e);
            return defaultSettings;
        }
    }
    return defaultSettings;
  });

  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [showNextGoalModal, setShowNextGoalModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CaneTicket | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Auto-fetch on mount
  useEffect(() => {
    handleFetchData(true);
  }, []); 

  // Save data on change
  useEffect(() => {
    localStorage.setItem('caneRecords', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('caneQuota', JSON.stringify(quota));
  }, [quota]);

  // --- Calculations ---
  const currentGoalRecords = useMemo(() => 
    records.filter(r => r.timestamp >= quota.currentGoalStartDate), 
  [records, quota.currentGoalStartDate]);

  const currentGoalWeightKg = useMemo(() => 
    currentGoalRecords.reduce((sum, r) => sum + r.netWeightKg, 0), 
  [currentGoalRecords]);

  const currentGoalWeightTons = currentGoalWeightKg / 1000;
  
  // Calculate Total Money for current goal
  const currentGoalTotalMoney = useMemo(() => 
    currentGoalRecords.reduce((sum, r) => sum + (r.totalValue || 0), 0),
  [currentGoalRecords]);

  const lifetimeWeightKg = useMemo(() => records.reduce((sum, r) => sum + r.netWeightKg, 0), [records]);
  const lifetimeWeightTons = lifetimeWeightKg / 1000;

  const percentage = Math.min(100, Math.max(0, (currentGoalWeightTons / quota.targetTons) * 100));
  const remainingTons = Math.max(0, quota.targetTons - currentGoalWeightTons);
  const isGoalAchieved = currentGoalWeightTons >= quota.targetTons;
  const currentRound = quota.history.length + 1;

  const chartData = [
    { name: 'Achieved', value: currentGoalWeightTons },
    { name: 'Remaining', value: remainingTons },
  ];

  // --- Handlers ---

  const handleFetchData = async (silent: boolean = false) => {
    setIsLoading(true);
    setConnectionStatus('idle');
    try {
      const cloudRecords = await fetchFromGoogleSheets();
      
      if (cloudRecords === null) {
          setConnectionStatus('error');
          if (!silent) {
            alert("⚠️ ไม่พบ URL ของ Google Script\n\nกรุณาตรวจสอบไฟล์ 'services/googleSheetsService.ts'");
          }
      } else {
        setConnectionStatus('success');
        if (cloudRecords.length > 0) {
            // ✅ Sync Goal Target from the latest record (Requirement 1)
            const latestRecord = cloudRecords[0]; // Assuming API returns newest first or we sort it
            if (latestRecord.goalTarget && latestRecord.goalTarget !== quota.targetTons) {
                setQuota(prev => ({ ...prev, targetTons: latestRecord.goalTarget! }));
            }
            
            setRecords(cloudRecords); 
            if (!silent) alert(`ดึงข้อมูลล่าสุดสำเร็จ ${cloudRecords.length} รายการ`);
        } else {
            if (!silent) alert("เชื่อมต่อสำเร็จ (ตารางยังว่างอยู่)");
        }
      }
    } catch (e) {
      console.error("Failed to fetch data", e);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRecord = async (ticketData: CaneTicket) => {
    const newTicket: CaneTicket = {
      ...ticketData,
      goalTarget: quota.targetTons,
      goalRound: currentRound
    };

    setRecords(prev => [...prev, newTicket]);
    setView(AppView.DASHBOARD);

    setIsSyncing(true);
    setTimeout(async () => {
        try {
          const success = await syncToGoogleSheets(newTicket);
          if (success) {
            console.log("Synced to Google Sheets successfully");
            setConnectionStatus('success');
          } else {
            setConnectionStatus('error');
          }
        } catch (e) {
          setConnectionStatus('error');
        } finally {
          setIsSyncing(false);
        }
    }, 500);
  };

  const handleUpdateRecord = async (updatedTicket: CaneTicket) => {
    // Update local state
    setRecords(prev => prev.map(r => r.id === updatedTicket.id ? updatedTicket : r));
    setEditingRecord(null);

    // Sync Update to Cloud
    setIsSyncing(true);
    try {
        await syncToGoogleSheets(updatedTicket, true); // true = update action
        console.log("Updated Google Sheets successfully");
    } catch (e) {
        console.error("Update failed", e);
        alert("อัปเดตข้อมูลบน Cloud ไม่สำเร็จ");
    } finally {
        setIsSyncing(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    const recordToDelete = records.find(r => r.id === id);
    if (!recordToDelete) return;

    const confirmed = window.confirm(`ต้องการลบรายการนี้ใช่หรือไม่?\n\nวันที่: ${recordToDelete.date}\nเลขที่ใบชั่ง: ${recordToDelete.ticketNumber}`);
    if (!confirmed) return;

    setRecords(prev => prev.filter(r => r.id !== id));

    if (recordToDelete.ticketNumber && recordToDelete.ticketNumber !== "-" && recordToDelete.ticketNumber.trim() !== "") {
        setIsSyncing(true);
        try {
            await deleteFromGoogleSheets(recordToDelete.ticketNumber);
        } catch(e) {
            alert("ลบข้อมูลจาก Google Sheets ไม่สำเร็จ");
        } finally {
            setIsSyncing(false);
        }
    }
  };

  const updateCurrentQuota = (newTarget: number) => {
    setQuota(prev => ({ 
      ...prev, 
      targetTons: newTarget
    }));
    setShowQuotaModal(false);
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
      history: [completedGoal, ...prev.history]
    }));
    
    setShowNextGoalModal(false);
  };

  const handleExportCSV = () => {
    if (records.length === 0) {
      alert("ไม่มีข้อมูลให้ส่งออก");
      return;
    }
    const headers = ["วันที่", "เวลา", "เลขที่ใบชั่ง", "ทะเบียนรถ", "น้ำหนักสุทธิ", "ความชื้น%", "ราคา/ตัน", "มูลค่ารวม"];
    const rows = records.map(r => [
      r.date, r.time, `"${r.ticketNumber}"`, `"${r.licensePlate}"`, r.netWeightKg, r.moisture || 0, r.canePrice || 0, r.totalValue || 0
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `cane_tracking_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Render Views ---

  const renderContent = () => {
    if (view === AppView.SCANNER) {
      return (
        <Scanner onSave={handleSaveRecord} onCancel={() => setView(AppView.DASHBOARD)} />
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
              {isSyncing && <span className="text-xs text-blue-500 animate-pulse font-normal">(Syncing...)</span>}
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              รวมทั้งหมด: {lifetimeWeightTons.toLocaleString()} ตัน
              {isLoading ? <span className="animate-spin text-green-600">⌛</span> : 
               connectionStatus === 'error' ? <span className="text-red-400 text-xs">⚠️ Offline</span> : 
               <span className="text-green-500 text-xs">● Online</span>
              }
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleFetchData()}
              className={`p-2 rounded-full transition-colors ${isLoading ? 'bg-green-50 text-green-600' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
            >
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
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
                   </>
                ) : (
                   <>
                     <span className="text-3xl font-bold text-green-700">{percentage.toFixed(1)}%</span>
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

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard 
            title="มูลค่ารวม (รอบนี้)" 
            value={`฿${currentGoalTotalMoney.toLocaleString()}`}
            icon={Coins}
            color="amber"
          />
           <SummaryCard 
            title={isGoalAchieved ? "เกินเป้า (ตัน)" : "เหลืออีก (ตัน)"}
            value={(isGoalAchieved ? (currentGoalWeightTons - quota.targetTons) : remainingTons).toLocaleString(undefined, { maximumFractionDigits: 1 })} 
            icon={Target}
            color="green"
          />
        </div>

        {/* Recent Records */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold text-gray-800">รายการล่าสุด</h2>
            <div className="flex items-center gap-2">
               <span className="text-xs text-gray-500">รวมทั้งหมด {records.length} รายการ</span>
            </div>
          </div>
          <RecordList 
            records={records} 
            onDelete={handleDeleteRecord} 
            onEdit={(record) => setEditingRecord(record)} 
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {renderContent()}

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

      {/* Edit Modal */}
      {editingRecord && (
          <EditModal 
            ticket={editingRecord} 
            onSave={handleUpdateRecord} 
            onClose={() => setEditingRecord(null)}
            priceTable={calculateCanePrice}
          />
      )}

      {/* Settings Modal */}
      {showQuotaModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Settings size={20} className="text-gray-600" />
              <span>การตั้งค่า</span>
            </h3>

            {/* Quota Only */}
            <div className="mb-6">
                <label className="block text-sm text-gray-600 mb-2 font-medium">เป้าหมายปัจจุบัน (ตัน)</label>
                <input 
                  type="number" 
                  defaultValue={quota.targetTons}
                  className="w-full border border-gray-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-green-500 outline-none mb-4"
                  id="quotaInput"
                />
                <button 
                    onClick={() => {
                        const val = document.getElementById('quotaInput') as HTMLInputElement;
                        updateCurrentQuota(Number(val.value));
                    }}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-sm hover:bg-green-700"
                >
                    บันทึกการตั้งค่า
                </button>
            </div>

            <hr className="border-gray-100 my-4" />

            <div className="mb-6">
                <button 
                    onClick={handleExportCSV}
                    className="w-full bg-white border border-green-200 text-green-700 hover:bg-green-50 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                    <Download size={18} />
                    <span>ส่งออกข้อมูล (CSV)</span>
                </button>
            </div>
            
            <button onClick={() => setShowQuotaModal(false)} className="w-full py-3 text-gray-400 font-medium hover:bg-gray-100 rounded-xl">
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* Next Goal Modal */}
      {showNextGoalModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden">
             {/* ... (Same as before) ... */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
            <div className="text-center mb-6">
                <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Trophy className="text-amber-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">ยินดีด้วย!</h3>
                <p className="text-sm text-gray-500">คุณทำสำเร็จตามเป้าหมายที่ {currentRound} แล้ว</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2 text-center">ตั้งเป้าหมายรอบใหม่ (ตัน)</label>
                <input 
                type="number" 
                defaultValue={1000}
                className="w-full bg-white border border-gray-300 rounded-lg p-3 text-2xl mb-2 focus:ring-2 focus:ring-amber-500 outline-none text-center font-bold text-gray-800"
                id="nextGoalInput"
                />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNextGoalModal(false)} className="flex-1 py-3 text-gray-500 font-medium hover:bg-gray-100 rounded-xl">ไว้ทีหลัง</button>
              <button 
                onClick={() => {
                  const val = document.getElementById('nextGoalInput') as HTMLInputElement;
                  handleStartNextGoal(Number(val.value));
                }}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl"
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
