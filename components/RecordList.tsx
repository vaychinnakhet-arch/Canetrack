import React, { useState } from 'react';
import { CaneTicket } from '../types';
import { ChevronDown, ChevronUp, Truck, FileText, Trash2, Target, Calendar } from 'lucide-react';

interface RecordListProps {
  records: CaneTicket[];
  onDelete: (id: string) => void;
}

export const RecordList: React.FC<RecordListProps> = ({ records, onDelete }) => {
  // Group records by date string
  const groupedRecords = records.reduce((groups, record) => {
    const dateKey = record.date || "ไม่ระบุวันที่";
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(record);
    return groups;
  }, {} as Record<string, CaneTicket[]>);

  // Sort dates descending (newest first)
  const sortedDates = Object.keys(groupedRecords).sort((a, b) => {
      // Try to parse DD/MM/YYYY
      const parseDate = (d: string) => {
          const parts = d.split('/');
          if(parts.length === 3) return new Date(Number(parts[2]), Number(parts[1])-1, Number(parts[0])).getTime();
          return new Date(d).getTime();
      };
      return parseDate(b) - parseDate(a);
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
    <div className="space-y-3 pb-24">
      {sortedDates.map((date) => (
        <DateGroup 
          key={date} 
          date={date} 
          records={groupedRecords[date]} 
          onDelete={onDelete} 
        />
      ))}
    </div>
  );
};

const DateGroup: React.FC<{ date: string; records: CaneTicket[]; onDelete: (id: string) => void }> = ({ date, records, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false); // Collapsed by default
  const totalWeight = records.reduce((sum, r) => sum + r.netWeightKg, 0);
  const totalWeightTons = totalWeight / 1000;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Date Header - Acts as the Summary Card */}
      <div 
        className="p-4 flex justify-between items-center cursor-pointer select-none active:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
            <Calendar size={22} className="text-green-600" />
            <span className="font-bold text-gray-700 text-lg">{date}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                {records.length} เที่ยว
            </span>
        </div>
        <div className="flex items-center gap-3">
            <span className="font-bold text-green-700 text-lg">
                {totalWeightTons.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} 
                <span className="text-sm font-normal text-gray-500 ml-1">ตัน</span>
            </span>
            {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
      </div>

      {/* List inside Date */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/50">
           {records.sort((a, b) => b.timestamp - a.timestamp).map((record, idx) => (
               <RecordItem key={record.id} record={record} onDelete={onDelete} isLast={idx === records.length - 1} />
           ))}
        </div>
      )}
    </div>
  );
};

const RecordItem: React.FC<{ record: CaneTicket; onDelete: (id: string) => void; isLast: boolean }> = ({ record, onDelete, isLast }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`transition-colors hover:bg-white ${!isLast ? 'border-b border-gray-100' : ''}`}>
      {/* Main Row */}
      <div 
        className="p-4 pl-12 flex items-center justify-between cursor-pointer select-none active:bg-gray-100"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center space-x-3">
          <div className="bg-white border border-green-100 p-2 rounded-full text-green-600 relative shadow-sm">
            <Truck size={16} />
          </div>
          <div>
            <div className="font-bold text-gray-800 text-base">{record.netWeightKg.toLocaleString()} <span className="text-xs font-normal text-gray-500">กก.</span></div>
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <span>{record.time}</span>
              <span>•</span>
              <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 border border-gray-200">{record.licensePlate}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
             <div className="text-xs text-gray-400 flex flex-col items-end">
                {record.goalRound && (
                    <span className="flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded mb-1 border border-amber-100">
                        <Target size={10} /> รอบ {record.goalRound}
                    </span>
                )}
                {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
             </div>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="bg-white p-4 pl-12 text-sm animate-fade-in pb-6 cursor-default">
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="col-span-2 flex items-start space-x-2 text-gray-600 mb-1">
               <FileText size={14} className="mt-0.5" />
               <span className="font-medium">เลขที่ใบชั่ง: {record.ticketNumber}</span>
            </div>

            {/* Quota Info Display */}
            {record.goalTarget && (
                <div className="col-span-2 bg-amber-50/50 border border-amber-100 p-2 rounded-lg flex justify-between items-center mb-1">
                    <span className="text-xs text-amber-700">เป้าหมายรอบที่ {record.goalRound || '-'}</span>
                    <span className="text-xs font-bold text-amber-700">เป้า: {record.goalTarget.toLocaleString()} ตัน</span>
                </div>
            )}
            
            <div className="bg-white p-2 rounded border border-gray-100">
              <span className="text-xs text-gray-400 block">น้ำหนักรวม</span>
              <span className="font-medium">{record.grossWeightKg?.toLocaleString() || '-'}</span>
            </div>
            
            <div className="bg-white p-2 rounded border border-gray-100">
              <span className="text-xs text-gray-400 block">น้ำหนักรถ</span>
              <span className="font-medium">{record.tareWeightKg?.toLocaleString() || '-'}</span>
            </div>
            
            <div className="col-span-2">
              <span className="text-xs text-gray-400 block">ลูกค้า/ชาวไร่</span>
              <span className="font-medium text-gray-700">{record.vendorName}</span>
            </div>

            <div className="col-span-2">
               <span className="text-xs text-gray-400 block">สินค้า</span>
               <span className="font-medium text-gray-700">{record.productName}</span>
            </div>

            {record.imageUrl && (
              <div className="col-span-2 mt-2">
                 <span className="text-xs text-gray-400 block mb-1">รูปภาพต้นฉบับ</span>
                 <img src={record.imageUrl} alt="Original Slip" className="rounded-lg max-h-48 object-contain bg-white border border-gray-200 w-full" />
              </div>
            )}
            
            {/* 🔴 ปุ่มลบแก้ไขใหม่ให้ใหญ่และกดง่ายขึ้น 🔴 */}
            <div className="col-span-2 mt-2 pt-2 border-t border-gray-200">
                <button 
                type="button"
                onClick={(e) => {
                    e.stopPropagation(); // ป้องกันไม่ให้การ์ดหุบ
                    e.preventDefault();
                    onDelete(record.id); // ส่ง ID ไปให้ App.tsx จัดการ confirm
                }}
                className="w-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all font-bold active:scale-95"
                >
                    <Trash2 size={18} />
                    <span>ลบรายการนี้</span>
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};