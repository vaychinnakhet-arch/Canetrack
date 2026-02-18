import React, { useMemo, useState } from 'react';
import { CaneTicket } from '../types';
import { TrendingUp, Calendar, DollarSign, Scale, Info, ArrowLeft, BarChart3, BrainCircuit, Loader2, Truck, Route, Sparkles, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyzeProductionTrend, AiTrendAnalysis } from '../services/geminiService';
import { LUCKY_EVENTS } from './LuckyDaysView';

interface AnalysisViewProps {
  records: CaneTicket[];
  onBack: () => void;
}

// วันหยุดนักขัตฤกษ์ ปี 2568 (ก.พ. - เม.ย.)
const THAI_HOLIDAYS = [
  "12/2",  // วันมาฆบูชา
  "6/4",   // วันจักรี
  "13/4",  // วันสงกรานต์
  "14/4",  // วันสงกรานต์
  "15/4",  // วันสงกรานต์
  "16/4",  // ชดเชยวันสงกรานต์
];

const getThaiMonth = (monthIndex: number) => {
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return months[monthIndex];
};

export const AnalysisView: React.FC<AnalysisViewProps> = ({ records, onBack }) => {
  const [mode, setMode] = useState<'conservative' | 'ai' | 'lucky'>('conservative');
  const [aiData, setAiData] = useState<AiTrendAnalysis | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const endDate = new Date(currentYear, 3, 30); // 30 April
  const today = new Date();

  // 1. Calculate Basic Stats (Original Logic)
  const stats = useMemo(() => {
    if (records.length === 0) return { avgWeightPerDay: 0, avgPricePerTon: 900, totalWeight: 0, totalIncome: 0, dailyTotalsMap: {} };

    const totalWeight = records.reduce((sum, r) => sum + r.netWeightKg, 0) / 1000;
    const totalIncome = records.reduce((sum, r) => sum + (r.totalValue || 0), 0);
    
    // Group by Day (String key to ensure unique dates)
    const dailyTotalsMap: Record<string, number> = {};
    records.forEach(r => {
        const dateKey = r.date;
        if (!dailyTotalsMap[dateKey]) dailyTotalsMap[dateKey] = 0;
        dailyTotalsMap[dateKey] += (r.netWeightKg / 1000);
    });

    const uniqueDaysWorked = Object.keys(dailyTotalsMap).length || 1;

    // --- Conservative: Total / Days Worked ---
    const avgWeightPerDay = totalWeight / uniqueDaysWorked;
    
    // Avg Price
    const recordsWithPrice = records.filter(r => r.canePrice && r.canePrice > 0);
    const avgPricePerTon = recordsWithPrice.length > 0 
        ? recordsWithPrice.reduce((sum, r) => sum + (r.canePrice || 0), 0) / recordsWithPrice.length
        : 900;

    return { avgWeightPerDay, avgPricePerTon, totalWeight, totalIncome, dailyTotalsMap };
  }, [records]);

  // Handle Mode Switching
  const handleModeChange = (newMode: 'conservative' | 'ai' | 'lucky') => {
    setMode(newMode);
    // If switching to AI or Lucky for the first time, fetch AI analysis
    // Both AI modes share the same AI data structure, so we fetch once
    if ((newMode === 'ai' || newMode === 'lucky') && !aiData && !isAiLoading) {
        setIsAiLoading(true);
        analyzeProductionTrend(records, LUCKY_EVENTS) // Pass Lucky Events here
            .then(result => {
                setAiData(result);
            })
            .catch(err => {
                console.error(err);
                alert("ไม่สามารถวิเคราะห์ AI ได้ในขณะนี้");
                setMode('conservative');
            })
            .finally(() => setIsAiLoading(false));
    }
  };

  // 2. Forecast Future Logic
  const forecast = useMemo(() => {
    let loopDate = new Date(today);
    loopDate.setDate(loopDate.getDate() + 1);

    let workingDays = 0;
    let holidayCount = 0;
    const futureEvents = [];

    // Base Rate
    let baseRate = stats.avgWeightPerDay;
    if ((mode === 'ai' || mode === 'lucky') && aiData) {
        baseRate = aiData.sustainableDailyRate;
    }

    let projectedExtraWeight = 0;

    while (loopDate <= endDate) {
        const dayKey = `${loopDate.getDate()}/${loopDate.getMonth() + 1}`; // d/m
        const isHoliday = THAI_HOLIDAYS.includes(dayKey);

        // Check Lucky/Unlucky Match
        const luckyEvent = LUCKY_EVENTS.find(e => e.dateStr === dayKey);
        let dailyRate = baseRate;

        // --- LUCKY MODE FORECAST LOGIC ---
        if (mode === 'lucky' && luckyEvent) {
             if (luckyEvent.type === 'good') {
                 // If Good day, assuming we perform at Max Capacity (e.g. 2 trips approx ~ baseRate * 1.5 or max 25 tons)
                 // Or use the avgLuckyDay from AI if available
                 if (aiData?.avgLuckyDay && aiData.avgLuckyDay > baseRate) {
                     dailyRate = aiData.avgLuckyDay;
                 } else {
                     dailyRate = baseRate * 1.2; // Boost 20%
                 }
             } else if (luckyEvent.type === 'bad') {
                 // If Bad day, reduce
                 if (aiData?.avgUnluckyDay && aiData.avgUnluckyDay < baseRate) {
                     dailyRate = aiData.avgUnluckyDay;
                 } else {
                     dailyRate = baseRate * 0.5; // Drop 50%
                 }
             }
        }

        if (isHoliday) {
            holidayCount++;
        } else {
            workingDays++;
            projectedExtraWeight += dailyRate; // Add specific rate for this day
        }
        
        // Markers for chart
        if (loopDate.getDate() % 5 === 0 || loopDate.getTime() === endDate.getTime()) {
            futureEvents.push({
                date: `${loopDate.getDate()} ${getThaiMonth(loopDate.getMonth())}`,
                timestamp: loopDate.getTime(),
                isForecast: true
            });
        }
        loopDate.setDate(loopDate.getDate() + 1);
    }

    const projectedExtraIncome = projectedExtraWeight * stats.avgPricePerTon;

    return { 
        workingDays, 
        holidayCount, 
        projectedExtraWeight, 
        projectedExtraIncome,
        finalWeight: stats.totalWeight + projectedExtraWeight,
        finalIncome: stats.totalIncome + projectedExtraIncome,
        usedRate: baseRate // Just for display
    };
  }, [stats, endDate, mode, aiData]);

  // 3. Chart Data
  const chartData = useMemo(() => {
    // Sort dates
    const sortedDateKeys = Object.keys(stats.dailyTotalsMap).sort((a,b) => {
        const parse = (dStr: string) => {
            const parts = dStr.split('/');
            if(parts.length === 3) {
                 let y = parseInt(parts[2]);
                 if(y > 2400) y -= 543;
                 return new Date(y, parseInt(parts[1])-1, parseInt(parts[0])).getTime();
            }
            return 0;
        };
        return parse(a) - parse(b);
    });

    let cumulativeWeight = 0;
    const historyPoints: any[] = [];

    sortedDateKeys.forEach(dateStr => {
        const weight = stats.dailyTotalsMap[dateStr];
        cumulativeWeight += weight;
        
        const parts = dateStr.split('/');
        const label = parts.length >= 2 ? `${parts[0]} ${getThaiMonth(parseInt(parts[1])-1)}` : dateStr;

        historyPoints.push({
            name: label,
            actual: cumulativeWeight,
            projected: cumulativeWeight,
        });
    });

    // Forecast points (Need day-by-day to reflect Lucky Mode fluctuations)
    const forecastPoints: any[] = [];
    let currentProjection = cumulativeWeight;
    
    // Simulate day by day for chart
    let loopDate = new Date(today.getTime() + 86400000);
    
    // Base Rate for simulation
    let baseRate = stats.avgWeightPerDay;
    if ((mode === 'ai' || mode === 'lucky') && aiData) {
        baseRate = aiData.sustainableDailyRate;
    }

    while (loopDate <= endDate) {
        const dayKey = `${loopDate.getDate()}/${loopDate.getMonth() + 1}`;
        const isHoliday = THAI_HOLIDAYS.includes(dayKey);
        
        // Logic same as above for chart consistency
        let dailyRate = baseRate;
        if (mode === 'lucky') {
             const luckyEvent = LUCKY_EVENTS.find(e => e.dateStr === dayKey);
             if (luckyEvent) {
                 if (luckyEvent.type === 'good') {
                     dailyRate = (aiData?.avgLuckyDay && aiData.avgLuckyDay > baseRate) ? aiData.avgLuckyDay : baseRate * 1.2;
                 } else if (luckyEvent.type === 'bad') {
                     dailyRate = (aiData?.avgUnluckyDay && aiData.avgUnluckyDay < baseRate) ? aiData.avgUnluckyDay : baseRate * 0.5;
                 }
             }
        }

        if (!isHoliday) {
            currentProjection += dailyRate;
        }

        // Add points at intervals
        if (loopDate.getDate() % 5 === 0 || loopDate.getTime() === endDate.getTime()) {
             forecastPoints.push({
                name: `${loopDate.getDate()} ${getThaiMonth(loopDate.getMonth())}`,
                actual: null,
                projected: currentProjection
            });
        }
        loopDate.setDate(loopDate.getDate() + 1);
    }

    return [...historyPoints, ...forecastPoints];
  }, [records, forecast, stats, today, endDate, mode, aiData]);

  if (records.length === 0) {
      return (
          <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] text-center">
              <Info size={48} className="text-gray-300 mb-4" />
              <h2 className="text-xl font-bold text-gray-700">ยังไม่มีข้อมูลเพียงพอ</h2>
              <button onClick={onBack} className="mt-6 text-green-600 font-bold hover:underline">กลับหน้าหลัก</button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 animate-fade-in">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
        <div className="max-w-md mx-auto p-4 flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-purple-600" />
            วิเคราะห์แนวโน้ม
          </h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Mode Selector */}
        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex relative overflow-hidden">
            <button 
                onClick={() => handleModeChange('conservative')}
                className={`flex-1 py-2 px-1 rounded-lg text-[10px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all relative z-10 ${mode === 'conservative' ? 'bg-gray-100 text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <BarChart3 size={16} />
                <span>ค่าเฉลี่ยปกติ</span>
            </button>
            <button 
                onClick={() => handleModeChange('ai')}
                className={`flex-1 py-2 px-1 rounded-lg text-[10px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all relative z-10 ${mode === 'ai' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
                {mode === 'ai' && isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                <span>AI สถิติเที่ยว</span>
            </button>
            <button 
                onClick={() => handleModeChange('lucky')}
                className={`flex-1 py-2 px-1 rounded-lg text-[10px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all relative z-10 ${mode === 'lucky' ? 'bg-pink-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
                {mode === 'lucky' && isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>AI วันดี/วันเสีย</span>
            </button>
        </div>

        {/* Date Info */}
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center justify-between text-purple-900">
            <div className="flex items-center gap-3">
                <Calendar className="text-purple-500" />
                <div>
                    <div className="text-xs opacity-70">สิ้นสุดการหีบอ้อย</div>
                    <div className="font-bold">30 เมษายน {currentYear + 543}</div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-2xl font-bold text-purple-700">{forecast.workingDays}</div>
                <div className="text-xs opacity-70">วันทำงานที่เหลือ</div>
            </div>
        </div>

        {/* Forecast Cards */}
        <div className="grid grid-cols-2 gap-4">
            {/* Tons Forecast */}
            <div className={`p-4 rounded-xl shadow-sm border relative overflow-hidden transition-all duration-300 ${mode === 'lucky' ? 'bg-pink-600 text-white border-pink-500' : mode === 'ai' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white border-gray-100'}`}>
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Scale size={64} className={(mode === 'ai' || mode === 'lucky') ? 'text-white' : 'text-green-600'} />
                </div>
                <div className={`text-sm mb-1 ${(mode === 'ai' || mode === 'lucky') ? 'text-white/80' : 'text-gray-500'}`}>คาดการณ์น้ำหนักรวม</div>
                <div className={`text-2xl font-bold ${(mode === 'ai' || mode === 'lucky') ? 'text-white' : 'text-green-700'}`}>
                    {forecast.finalWeight.toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-sm font-normal opacity-70">ตัน</span>
                </div>
                <div className={`mt-2 text-xs flex items-center gap-1 w-fit px-2 py-1 rounded-full ${(mode === 'ai' || mode === 'lucky') ? 'bg-white/20 text-white' : 'bg-green-50 text-green-600'}`}>
                    <TrendingUp size={12} />
                    +{forecast.projectedExtraWeight.toLocaleString(undefined, {maximumFractionDigits: 0})} ตัน (อนาคต)
                </div>
            </div>

            {/* Income Forecast */}
            <div className={`p-4 rounded-xl shadow-sm border relative overflow-hidden transition-all duration-300 ${mode === 'lucky' ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white border-rose-500' : mode === 'ai' ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-orange-500' : 'bg-white border-gray-100'}`}>
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <DollarSign size={64} className={(mode === 'ai' || mode === 'lucky') ? 'text-white' : 'text-amber-500'} />
                </div>
                <div className={`text-sm mb-1 ${(mode === 'ai' || mode === 'lucky') ? 'text-white/80' : 'text-gray-500'}`}>คาดการณ์รายได้รวม</div>
                <div className={`text-2xl font-bold ${(mode === 'ai' || mode === 'lucky') ? 'text-white' : 'text-amber-600'}`}>
                    {forecast.finalIncome.toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-sm font-normal opacity-70">บาท</span>
                </div>
                <div className={`mt-2 text-xs flex items-center gap-1 w-fit px-2 py-1 rounded-full ${(mode === 'ai' || mode === 'lucky') ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'}`}>
                    <TrendingUp size={12} />
                    +{(forecast.projectedExtraIncome).toLocaleString(undefined, {maximumFractionDigits: 0})} บาท
                </div>
            </div>
        </div>

        {/* Stats & Insights Block */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 relative overflow-hidden">
            {mode === 'ai' && <div className="absolute top-0 right-0 p-3 opacity-5"><BrainCircuit size={100} className="text-indigo-500" /></div>}
            {mode === 'lucky' && <div className="absolute top-0 right-0 p-3 opacity-5"><Sparkles size={100} className="text-pink-500" /></div>}
            
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 relative z-10">
                {mode === 'ai' ? <Route size={18} className="text-indigo-500" /> : 
                 mode === 'lucky' ? <Sparkles size={18} className="text-pink-500" /> :
                 <Info size={18} />}
                {mode === 'ai' ? 'วิเคราะห์พฤติกรรมการวิ่ง (AI)' : 
                 mode === 'lucky' ? 'วิเคราะห์สถิติวันดี/วันเสีย (AI)' :
                 'ประสิทธิภาพจากค่าเฉลี่ย'}
            </h3>
            
            <div className="space-y-3 relative z-10">
                
                {/* Mode: Lucky Day Analysis */}
                {mode === 'lucky' && aiData && (
                     <div className="space-y-3">
                         <div className="flex items-center justify-between text-sm text-gray-600">
                             <span>เฉลี่ยวันทั่วไป:</span>
                             <span className="font-bold">{forecast.usedRate.toFixed(2)} ตัน/วัน</span>
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                <div className="text-xs text-green-700 mb-1 flex items-center gap-1 font-bold"><CheckCircle size={12}/> สถิติวันดี (Lucky)</div>
                                <div className="text-xl font-bold text-green-700">{aiData.avgLuckyDay ? aiData.avgLuckyDay.toFixed(2) : '-'} <span className="text-xs">ตัน</span></div>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                <div className="text-xs text-red-700 mb-1 flex items-center gap-1 font-bold"><XCircle size={12}/> สถิติวันเสีย (Bad)</div>
                                <div className="text-xl font-bold text-red-700">{aiData.avgUnluckyDay ? aiData.avgUnluckyDay.toFixed(2) : '-'} <span className="text-xs">ตัน</span></div>
                            </div>
                         </div>
                         <div className="bg-pink-50 p-3 rounded-lg border border-pink-100">
                             <div className="text-xs font-bold text-pink-700 mb-1">ผลวิเคราะห์จาก AI:</div>
                             <p className="text-sm text-pink-900 leading-relaxed">"{aiData.luckyDayCorrelation}"</p>
                         </div>
                     </div>
                )}

                {/* Mode: AI Trip */}
                {mode === 'ai' && aiData && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">ความสามารถส่งอ้อยต่อวัน</span>
                            <div className="text-right">
                                <span className={`font-bold text-lg text-indigo-600`}>
                                    {forecast.usedRate.toFixed(2)} 
                                </span>
                                <span className="text-xs text-gray-400 ml-1">ตัน/วัน</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-indigo-50 p-2 rounded border border-indigo-100">
                                <div className="text-[10px] text-indigo-400 mb-1 flex items-center gap-1"><Truck size={10}/> น้ำหนักที่คงที่/เที่ยว</div>
                                <div className="font-bold text-indigo-700">{aiData.stableWeightPerTrip.toFixed(2)} ตัน</div>
                            </div>
                            <div className="bg-indigo-50 p-2 rounded border border-indigo-100">
                                <div className="text-[10px] text-indigo-400 mb-1 flex items-center gap-1"><Route size={10}/> พฤติกรรม</div>
                                <div className="font-bold text-xs text-indigo-700 truncate" title={aiData.tripBehavior}>{aiData.tripBehavior}</div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                             <span className="font-bold text-gray-700">เหตุผล:</span> {aiData.reasoning}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {(mode === 'ai' || mode === 'lucky') && isAiLoading && (
                    <div className="text-center py-8 text-gray-400 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="animate-spin text-purple-500" size={24} /> 
                        <span>AI กำลังวิเคราะห์ข้อมูลของคุณ...</span>
                    </div>
                )}

                {/* Conservative Specific */}
                {mode === 'conservative' && (
                     <div className="space-y-2">
                         <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">ความสามารถส่งอ้อยต่อวัน</span>
                            <div className="text-right">
                                <span className={`font-bold text-lg text-gray-800`}>
                                    {forecast.usedRate.toFixed(2)} 
                                </span>
                                <span className="text-xs text-gray-400 ml-1">ตัน/วัน</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">ราคาเฉลี่ยที่ได้</span>
                            <span className="font-bold text-gray-800">{stats.avgPricePerTon.toLocaleString()} บาท/ตัน</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-80">
            <h3 className="font-bold text-gray-700 mb-4 text-sm flex items-center justify-between">
                <span>กราฟแนวโน้ม</span>
                {mode === 'ai' && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">AI Mode</span>}
                {mode === 'lucky' && <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">Lucky Mode</span>}
            </h3>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={mode === 'lucky' ? "#db2777" : mode === 'ai' ? "#6366f1" : "#8B5CF6"} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={mode === 'lucky' ? "#db2777" : mode === 'ai' ? "#6366f1" : "#8B5CF6"} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{fontSize: 10}} interval="preserveStartEnd" />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`${value.toLocaleString()} ตัน`, '']}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorActual)" 
                        name="ของจริง"
                    />
                    <Area 
                        type="monotone" 
                        dataKey="projected" 
                        stroke={mode === 'lucky' ? "#db2777" : mode === 'ai' ? "#6366f1" : "#8B5CF6"}
                        strokeDasharray="5 5"
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorProjected)" 
                        name="คาดการณ์"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};