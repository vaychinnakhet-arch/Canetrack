import React, { useMemo } from 'react';
import { CaneTicket } from '../types';
import { TrendingUp, Calendar, ArrowRight, DollarSign, Scale, Info, ArrowLeft } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalysisViewProps {
  records: CaneTicket[];
  onBack: () => void;
}

// วันหยุดนักขัตฤกษ์ ปี 2568 (ก.พ. - เม.ย.)
// Format: D/M (ไม่ต้องใส่ปี เพราะจะเทียบกับปีปัจจุบัน)
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
  const currentYear = new Date().getFullYear();
  // Target date: 30 April of current year
  const endDate = new Date(currentYear, 3, 30); // Month is 0-indexed (3 = April)
  const today = new Date();

  // 1. Calculate Stats from History
  const stats = useMemo(() => {
    if (records.length === 0) return { avgWeightPerDay: 0, avgPricePerTon: 900, totalWeight: 0, totalIncome: 0 };

    const totalWeight = records.reduce((sum, r) => sum + r.netWeightKg, 0) / 1000;
    const totalIncome = records.reduce((sum, r) => sum + (r.totalValue || 0), 0);
    
    // Count unique days worked
    const uniqueDays = new Set(records.map(r => r.date));
    const daysWorked = uniqueDays.size || 1;

    const avgWeightPerDay = totalWeight / daysWorked;
    
    // Calculate weighted average price or default to 900 if no data
    const recordsWithPrice = records.filter(r => r.canePrice && r.canePrice > 0);
    const avgPricePerTon = recordsWithPrice.length > 0 
        ? recordsWithPrice.reduce((sum, r) => sum + (r.canePrice || 0), 0) / recordsWithPrice.length
        : 900;

    return { avgWeightPerDay, avgPricePerTon, totalWeight, totalIncome };
  }, [records]);

  // 2. Forecast Future
  const forecast = useMemo(() => {
    let loopDate = new Date(today);
    loopDate.setDate(loopDate.getDate() + 1); // Start forecasting from tomorrow

    let workingDays = 0;
    let holidayCount = 0;
    const futureEvents = [];

    // Loop until April 30
    while (loopDate <= endDate) {
        const dayKey = `${loopDate.getDate()}/${loopDate.getMonth() + 1}`;
        const isHoliday = THAI_HOLIDAYS.includes(dayKey);

        // Logic: Sunday is a working day (Include), Holiday is OFF (Exclude)
        if (isHoliday) {
            holidayCount++;
        } else {
            workingDays++;
        }

        // Add to chart data (simplified: add point every 5 days or if it's end date)
        if (loopDate.getDate() % 5 === 0 || loopDate.getTime() === endDate.getTime()) {
            futureEvents.push({
                date: `${loopDate.getDate()} ${getThaiMonth(loopDate.getMonth())}`,
                timestamp: loopDate.getTime(),
                isForecast: true
            });
        }

        // Next day
        loopDate.setDate(loopDate.getDate() + 1);
    }

    const projectedExtraWeight = workingDays * stats.avgWeightPerDay;
    const projectedExtraIncome = projectedExtraWeight * stats.avgPricePerTon;

    return { 
        workingDays, 
        holidayCount, 
        projectedExtraWeight, 
        projectedExtraIncome,
        finalWeight: stats.totalWeight + projectedExtraWeight,
        finalIncome: stats.totalIncome + projectedExtraIncome
    };
  }, [stats, endDate]);

  // 3. Prepare Chart Data (History + Forecast)
  const chartData = useMemo(() => {
    // History Data (Group by Day)
    const historyMap = new Map<string, number>();
    const sortedRecords = [...records].sort((a,b) => a.timestamp - b.timestamp);
    
    // Aggregate cumulative weight
    let cumulativeWeight = 0;
    const historyPoints: any[] = [];
    
    // Create a map of date -> daily total to handle multiple trips per day
    const dailyTotals: Record<string, number> = {};
    sortedRecords.forEach(r => {
        // Simple date key YYYY-MM-DD for grouping
        const d = new Date(r.timestamp);
        const key = `${d.getDate()} ${getThaiMonth(d.getMonth())}`;
        if (!dailyTotals[key]) dailyTotals[key] = 0;
        dailyTotals[key] += (r.netWeightKg / 1000);
    });

    Object.keys(dailyTotals).forEach(key => {
        cumulativeWeight += dailyTotals[key];
        historyPoints.push({
            name: key,
            actual: cumulativeWeight,
            projected: cumulativeWeight, // Connect lines
        });
    });

    // Forecast Data points
    const forecastPoints: any[] = [];
    let currentProjWeight = cumulativeWeight;
    
    // Just 3-4 points for the projection line to keep chart clean
    const checkpoints = [
        new Date(today.getTime() + (7 * 86400000)), // Next week
        new Date(today.getTime() + (30 * 86400000)), // Next month
        endDate // End date
    ];

    checkpoints.forEach(d => {
        if (d > endDate) d = endDate;
        if (d > today) {
            // Estimate weight at this point
            // Days diff
            const diffTime = Math.abs(d.getTime() - today.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Rough estimation including holidays logic would be complex for chart points, 
            // so we linearize it based on avg * diffDays * (work_ratio)
            const workRatio = forecast.workingDays / (forecast.workingDays + forecast.holidayCount);
            const addedWeight = stats.avgWeightPerDay * diffDays * workRatio;
            
            forecastPoints.push({
                name: `${d.getDate()} ${getThaiMonth(d.getMonth())}`,
                actual: null,
                projected: cumulativeWeight + addedWeight
            });
        }
    });

    // Merge logic: ensure the last history point connects to first forecast
    return [...historyPoints, ...forecastPoints];

  }, [records, forecast, stats, today, endDate]);

  if (records.length === 0) {
      return (
          <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] text-center">
              <Info size={48} className="text-gray-300 mb-4" />
              <h2 className="text-xl font-bold text-gray-700">ยังไม่มีข้อมูลเพียงพอ</h2>
              <p className="text-gray-500 mt-2">กรุณาบันทึกรายการส่งอ้อยอย่างน้อย 1 รายการ<br/>เพื่อเริ่มการวิเคราะห์แนวโน้ม</p>
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
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Scale size={64} className="text-green-600" />
                </div>
                <div className="text-sm text-gray-500 mb-1">คาดการณ์น้ำหนักรวม</div>
                <div className="text-2xl font-bold text-green-700">
                    {forecast.finalWeight.toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-sm font-normal text-gray-400">ตัน</span>
                </div>
                <div className="mt-2 text-xs text-green-600 flex items-center gap-1 bg-green-50 w-fit px-2 py-1 rounded-full">
                    <TrendingUp size={12} />
                    +{forecast.projectedExtraWeight.toLocaleString(undefined, {maximumFractionDigits: 0})} ตัน (อนาคต)
                </div>
            </div>

            {/* Income Forecast */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <DollarSign size={64} className="text-amber-500" />
                </div>
                <div className="text-sm text-gray-500 mb-1">คาดการณ์รายได้รวม</div>
                <div className="text-2xl font-bold text-amber-600">
                    {(forecast.finalIncome / 1000).toFixed(1)} <span className="text-sm font-normal text-gray-400">หมื่น</span>
                </div>
                <div className="mt-2 text-xs text-amber-600 flex items-center gap-1 bg-amber-50 w-fit px-2 py-1 rounded-full">
                    <TrendingUp size={12} />
                    +{(forecast.projectedExtraIncome).toLocaleString(undefined, {maximumFractionDigits: 0})} บาท
                </div>
            </div>
        </div>

        {/* Current Performance Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Info size={16} /> ประสิทธิภาพปัจจุบัน
            </h3>
            <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                    <span className="text-gray-500 text-sm">เฉลี่ยต่อวัน (เฉพาะวันที่ส่ง)</span>
                    <span className="font-bold text-gray-800">{stats.avgWeightPerDay.toFixed(2)} ตัน/วัน</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                    <span className="text-gray-500 text-sm">ราคาเฉลี่ยที่ได้</span>
                    <span className="font-bold text-gray-800">{stats.avgPricePerTon.toLocaleString()} บาท/ตัน</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">วันหยุดนักขัตฤกษ์ที่เหลือ</span>
                    <span className="font-bold text-red-500">{forecast.holidayCount} วัน</span>
                </div>
            </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-80">
            <h3 className="font-bold text-gray-700 mb-4 text-sm">กราฟแนวโน้มสะสม (Actual vs Forecast)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
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
                        stroke="#8B5CF6" 
                        strokeDasharray="5 5"
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorProjected)" 
                        name="คาดการณ์"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-gray-400 text-center px-4">
            * การคำนวณอ้างอิงจากค่าเฉลี่ยในอดีต หักลบวันหยุดนักขัตฤกษ์ (มาฆบูชา, จักรี, สงกรานต์) แต่รวมวันอาทิตย์
        </div>
      </div>
    </div>
  );
};
