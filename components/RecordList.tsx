import React, { useState, useMemo } from 'react';
import { CaneTicket } from '../types';
import { ChevronDown, ChevronUp, Truck, FileText, Trash2, Calendar, Edit, X, Droplets, Coins, PlusCircle, Calculator, ImageOff, ExternalLink, ChevronRight, Folder } from 'lucide-react';

interface RecordListProps {
  records: CaneTicket[];
  onDelete: (id: string) => void;
  onEdit: (ticket: CaneTicket) => void;
}

// Helper to parse date string to timestamp for sorting
const parseDateScore = (dateStr: string) => {
    const str = dateStr.trim();
    if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
            let d = parseInt(parts[0]);
            let m = parseInt(parts[1]);
            let y = parseInt(parts[2]);
            if (y > 2400) y -= 543; 
            return new Date(y, m - 1, d).getTime();
        }
    }
    const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const parts = str.split(' ');
    if (parts.length >= 3) {
        const d = parseInt(parts[0]);
        const mStr = parts[1];
        const yStr = parts[parts.length-1];
        const y = parseInt(yStr);
        const mIndex = thaiMonths.findIndex(m => mStr.includes(m));
        if (mIndex !== -1 && !isNaN(d) && !isNaN(y)) {
            let adYear = y > 2400 ? y - 543 : y;
            return new Date(adYear, mIndex, d).getTime();
        }
    }
    const fallback = new Date(str).getTime();
    return isNaN(fallback) ? 0 : fallback;
};

// Helper to get Month Year string from date string
const getMonthYearKey = (dateStr: string) => {
    const ts = parseDateScore(dateStr);
    if (ts === 0) return "ไม่ระบุ";
    const d = new Date(ts);
    const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    return `${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
};

export const RecordList: React.FC<RecordListProps> = ({ records, onDelete, onEdit }) => {
  // 1. Group by Month Year
  const groupedByMonth = useMemo(() => {
      const groups: Record<string, CaneTicket[]> = {};
      records.forEach(r => {
          const key = getMonthYearKey(r.date);
          if (!groups[key]) groups[key] = [];
          groups[key].push(r);
      });
      return groups;
  }, [records]);

  // Sort Months (Newest First)
  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => {
      // Hacky sort based on Thai month string, but since we usually view recent data, let's try to parse one record from each group
      const recA = groupedByMonth[a][0];
      const recB = groupedByMonth[b][0];
      return parseDateScore(recB.date) - parseDateScore(recA.date);
  });

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm mx-1">
        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar size={32} className="text-gray-300" />
        </div>
        <p>ยังไม่มีรายการบันทึก</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {sortedMonths.map((month, index) => (
        <MonthGroup 
            key={month} 
            month={month} 
            records={groupedByMonth[month]} 
            onDelete={onDelete} 
            onEdit={onEdit}
            defaultExpanded={index === 0} // Expand only the first month by default
        />
      ))}
    </div>
  );
};

const MonthGroup: React.FC<{ 
    month: string; 
    records: CaneTicket[]; 
    onDelete: (id: string) => void; 
    onEdit: (t: CaneTicket) => void;
    defaultExpanded: boolean;
}> = ({ month, records, onDelete, onEdit, defaultExpanded }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    // Calculate Month Totals
    const totalWeight = records.reduce((sum, r) => sum + r.netWeightKg, 0) / 1000;
    const totalMoney = records.reduce((sum, r) => sum + (r.totalValue || 0), 0);

    // Group records inside month by Date
    const groupedByDate = records.reduce((groups, record) => {
        const dateKey = record.date || "ไม่ระบุวันที่";
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(record);
        return groups;
    }, {} as Record<string, CaneTicket[]>);

    // Sort dates (Newest First within month)
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => parseDateScore(b) - parseDateScore(a));

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Month Header */}
            <div 
                className={`p-5 flex justify-between items-center cursor-pointer select-none transition-colors ${isExpanded ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isExpanded ? 'bg-green-200 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <Folder size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">{month}</h3>
                        <p className="text-xs text-gray-500">{records.length} รายการ</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                         <div className="text-sm font-bold text-gray-700">{totalWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ตัน</div>
                         <div className="text-xs text-amber-600">฿{totalMoney.toLocaleString()}</div>
                    </div>
                    <div className="text-right sm:hidden">
                         <div className="text-sm font-bold text-gray-700">{totalWeight.toFixed(1)} ตัน</div>
                    </div>
                    {isExpanded ? <ChevronDown className="text-gray-400" /> : <ChevronRight className="text-gray-400" />}
                </div>
            </div>

            {/* Content (List of Date Groups) */}
            {isExpanded && (
                <div className="p-2 space-y-2 bg-gray-50/30">
                     {sortedDates.map(date => (
                         <DateGroup 
                            key={date} 
                            date={date} 
                            records={groupedByDate[date]} 
                            onDelete={onDelete} 
                            onEdit={onEdit} 
                        />
                     ))}
                </div>
            )}
        </div>
    );
};

const DateGroup: React.FC<{ date: string; records: CaneTicket[]; onDelete: (id: string) => void; onEdit: (t: CaneTicket) => void }> = ({ date, records, onDelete, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false); // Default collapsed inside month
  const totalWeight = records.reduce((sum, r) => sum + r.netWeightKg, 0);
  const totalWeightTons = totalWeight / 1000;
  
  // Sort records by timestamp descending (newest first)
  const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden transition-all duration-200">
      <div 
        className="px-4 py-3 flex justify-between items-center cursor-pointer select-none active:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${isExpanded ? 'bg-green-500' : 'bg-green-200'}`}></div>
            <span className="font-semibold text-gray-700 text-sm">{date}</span>
            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {records.length}
            </span>
        </div>
        <div className="flex items-center gap-2">
            <span className="font-semibold text-green-700 text-sm">
                {totalWeightTons.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} 
                <span className="text-[10px] font-normal text-gray-400 ml-1">ตัน</span>
            </span>
            {isExpanded ? <ChevronDown size={14} className="text-gray-300"/> : <ChevronRight size={14} className="text-gray-300"/>}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-50">
           {sortedRecords.map((record, idx) => (
               <RecordItem key={record.id} record={record} onDelete={onDelete} onEdit={onEdit} isLast={idx === sortedRecords.length - 1} />
           ))}
        </div>
      )}
    </div>
  );
};

const RecordItem: React.FC<{ record: CaneTicket; onDelete: (id: string) => void; onEdit: (t: CaneTicket) => void; isLast: boolean }> = ({ record, onDelete, onEdit, isLast }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  const hasMoisture = record.moisture !== undefined && record.moisture > 0;

  return (
    <>
    <div className={`transition-colors hover:bg-gray-50 ${!isLast ? 'border-b border-gray-50' : ''}`}>
      <div 
        className="p-3 pl-8 flex items-center justify-between cursor-pointer select-none active:bg-gray-100"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center space-x-3">
          <div className="bg-green-50 border border-green-100 p-1.5 rounded text-green-600 relative">
            <Truck size={14} />
          </div>
          <div>
            <div className="font-bold text-gray-800 text-sm">{record.netWeightKg.toLocaleString()} <span className="text-[10px] font-normal text-gray-400">กก.</span></div>
            <div className="text-[10px] text-gray-400 flex items-center space-x-1">
              <span>{record.time}</span>
              <span>•</span>
              <span className="bg-gray-100 px-1 py-0.5 rounded text-gray-500 border border-gray-200">{record.licensePlate}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
             <div className="text-xs text-gray-400 flex flex-col items-end">
                {hasMoisture ? (
                   <span className="flex items-center gap-1 text-blue-600 font-bold text-xs mb-1">
                      {record.moisture}% <Droplets size={8} /> 
                   </span>
                ) : (
                    <span className="text-gray-300 text-[10px] mb-1">-</span>
                )}
                {/* Visual indicator for expanded state */}
             </div>
        </div>
      </div>

      {showDetails && (
        <div className="bg-gray-50/50 p-3 pl-8 text-sm animate-fade-in pb-4 cursor-default shadow-inner">
          <div className="grid grid-cols-2 gap-y-2 gap-x-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            
            <div className="col-span-2 flex justify-between items-start border-b border-gray-100 pb-2 mb-1">
                 <div className="flex items-start space-x-2 text-gray-600">
                    <FileText size={14} className="mt-0.5" />
                    <span className="font-medium text-xs">ใบชั่ง: {record.ticketNumber}</span>
                 </div>
                 
                 <button 
                   onClick={(e) => { e.stopPropagation(); onEdit(record); }}
                   className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-[10px] bg-gray-50 px-2 py-1 rounded border border-gray-200"
                 >
                   <Edit size={10} /> แก้ไข
                 </button>
            </div>

            {/* Moisture & Price Section */}
            <div className="col-span-2">
                {!hasMoisture ? (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(record); }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <PlusCircle size={16} />
                        <span className="font-bold text-sm">ระบุความชื้น / คำนวณเงิน</span>
                    </button>
                ) : (
                    <div 
                        onClick={(e) => { e.stopPropagation(); onEdit(record); }}
                        className="bg-blue-50 border border-blue-100 rounded-lg p-2 cursor-pointer hover:bg-blue-100 transition-colors group relative"
                    >
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="text-[10px] text-gray-500 block">ความชื้น</span>
                                <span className="font-bold text-lg text-blue-700">{record.moisture}%</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-gray-500 block">มูลค่ารวม</span>
                                <span className="font-bold text-lg text-amber-600">{record.totalValue?.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Edit size={10} className="text-blue-400"/>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="col-span-2">
              <span className="text-[10px] text-gray-400 block">ลูกค้า/ชาวไร่</span>
              <span className="font-medium text-gray-700 text-xs">{record.vendorName}</span>
            </div>

            {record.imageUrl && (
              <div className="col-span-2 mt-1">
                 {!imageError ? (
                    <div className="relative group cursor-zoom-in" onClick={() => setShowImageModal(true)}>
                        <img 
                            src={record.imageUrl} 
                            alt="Slip" 
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={() => setImageError(true)}
                            className="rounded-lg h-24 w-full object-cover bg-gray-100 border border-gray-200" 
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                            <span className="bg-black/50 text-white text-[10px] px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">ขยายภาพ</span>
                        </div>
                    </div>
                 ) : (
                    <div className="w-full py-2 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 border border-gray-200 border-dashed gap-2">
                        <ImageOff size={16} />
                        <a 
                            href={record.imageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-500 underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            เปิดลิงก์ <ExternalLink size={8} />
                        </a>
                    </div>
                 )}
              </div>
            )}
            
            <div className="col-span-2 mt-1 pt-2 border-t border-gray-100 text-center">
                <button 
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete(record.id);
                }}
                className="text-red-400 hover:text-red-600 text-[10px] flex items-center justify-center space-x-1 mx-auto"
                >
                    <Trash2 size={10} />
                    <span>ลบรายการนี้</span>
                </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Full Screen Image Modal */}
    {showImageModal && record.imageUrl && !imageError && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
            <div className="relative max-w-full max-h-full">
                <button 
                   onClick={() => setShowImageModal(false)}
                   className="absolute -top-10 right-0 text-white p-2"
                >
                    <X size={24} />
                </button>
                <img 
                    src={record.imageUrl} 
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous" 
                    className="max-w-full max-h-[90vh] object-contain rounded" 
                />
            </div>
        </div>
    )}
    </>
  );
};