import React, { useState } from 'react';
import { CaneTicket } from '../types';
import { ChevronDown, ChevronUp, Truck, FileText, Trash2, Target, Calendar, Edit, X, Droplets, Coins } from 'lucide-react';

interface RecordListProps {
  records: CaneTicket[];
  onDelete: (id: string) => void;
  onEdit: (ticket: CaneTicket) => void;
}

export const RecordList: React.FC<RecordListProps> = ({ records, onDelete, onEdit }) => {
  // Group records by date string
  const groupedRecords = records.reduce((groups, record) => {
    const dateKey = record.date || "ไม่ระบุวันที่";
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(record);
    return groups;
  }, {} as Record<string, CaneTicket[]>);

  // Sort dates ASCENDING (oldest first)
  const sortedDates = Object.keys(groupedRecords).sort((a, b) => {
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
      return parseDateScore(a) - parseDateScore(b);
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
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

const DateGroup: React.FC<{ date: string; records: CaneTicket[]; onDelete: (id: string) => void; onEdit: (t: CaneTicket) => void }> = ({ date, records, onDelete, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalWeight = records.reduce((sum, r) => sum + r.netWeightKg, 0);
  const totalWeightTons = totalWeight / 1000;
  const totalMoney = records.reduce((sum, r) => sum + (r.totalValue || 0), 0);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
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
        <div className="flex flex-col items-end">
            <span className="font-bold text-green-700 text-lg">
                {totalWeightTons.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} 
                <span className="text-sm font-normal text-gray-500 ml-1">ตัน</span>
            </span>
            {totalMoney > 0 && (
                <span className="text-xs text-amber-600 font-medium">฿{totalMoney.toLocaleString()}</span>
            )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/50">
           {records.sort((a, b) => a.timestamp - b.timestamp).map((record, idx) => (
               <RecordItem key={record.id} record={record} onDelete={onDelete} onEdit={onEdit} isLast={idx === records.length - 1} />
           ))}
        </div>
      )}
    </div>
  );
};

const RecordItem: React.FC<{ record: CaneTicket; onDelete: (id: string) => void; onEdit: (t: CaneTicket) => void; isLast: boolean }> = ({ record, onDelete, onEdit, isLast }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  return (
    <>
    <div className={`transition-colors hover:bg-white ${!isLast ? 'border-b border-gray-100' : ''}`}>
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
                {record.moisture ? (
                   <span className="flex items-center gap-1 text-blue-600 font-medium mb-1">
                      <Droplets size={10} /> {record.moisture}%
                   </span>
                ) : null}
                {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
             </div>
        </div>
      </div>

      {showDetails && (
        <div className="bg-white p-4 pl-12 text-sm animate-fade-in pb-6 cursor-default">
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            
            <div className="col-span-2 flex justify-between items-start">
                 <div className="flex items-start space-x-2 text-gray-600">
                    <FileText size={14} className="mt-0.5" />
                    <span className="font-medium">ใบชั่ง: {record.ticketNumber}</span>
                 </div>
                 <button 
                   onClick={(e) => { e.stopPropagation(); onEdit(record); }}
                   className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs font-bold bg-blue-50 px-2 py-1 rounded-lg border border-blue-100"
                 >
                   <Edit size={12} /> แก้ไข
                 </button>
            </div>

            {/* Price & Moisture Display */}
            <div className="col-span-2 grid grid-cols-2 gap-2 bg-white p-2 rounded border border-gray-200">
                 <div>
                    <span className="text-xs text-gray-400 block mb-1">ความชื้น</span>
                    <span className={`font-bold text-lg ${record.moisture ? 'text-blue-600' : 'text-gray-300'}`}>
                        {record.moisture ? `${record.moisture}%` : '-'}
                    </span>
                 </div>
                 <div className="text-right">
                    <span className="text-xs text-gray-400 block mb-1">ราคา/ตัน</span>
                    <span className="font-medium text-gray-700">
                        {record.canePrice ? `${record.canePrice.toLocaleString()} บ.` : '-'}
                    </span>
                 </div>
                 {record.totalValue && (
                     <div className="col-span-2 border-t border-gray-100 pt-2 mt-1 flex justify-between items-center">
                        <span className="text-xs text-amber-600 font-bold flex items-center gap-1"><Coins size={12}/> มูลค่ารวม</span>
                        <span className="text-lg font-bold text-amber-600">{record.totalValue.toLocaleString()} บาท</span>
                     </div>
                 )}
            </div>

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
                 <span className="text-xs text-gray-400 block mb-1">รูปภาพต้นฉบับ (กดเพื่อดูภาพใหญ่)</span>
                 <img 
                   src={record.imageUrl} 
                   alt="Original Slip" 
                   onClick={() => setShowImageModal(true)}
                   className="rounded-lg max-h-48 object-contain bg-white border border-gray-200 w-full cursor-zoom-in hover:opacity-95 transition-opacity" 
                 />
              </div>
            )}
            
            <div className="col-span-2 mt-2 pt-2 border-t border-gray-200">
                <button 
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete(record.id);
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

    {/* Full Screen Image Modal */}
    {showImageModal && record.imageUrl && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
            <div className="relative max-w-full max-h-full">
                <button 
                   onClick={() => setShowImageModal(false)}
                   className="absolute -top-10 right-0 text-white p-2"
                >
                    <X size={24} />
                </button>
                <img src={record.imageUrl} className="max-w-full max-h-[90vh] object-contain rounded" />
            </div>
        </div>
    )}
    </>
  );
};