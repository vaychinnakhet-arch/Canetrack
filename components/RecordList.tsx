import React, { useState } from 'react';
import { CaneTicket } from '../types';
import { ChevronDown, ChevronUp, Truck, Scale, Calendar, FileText, Trash2 } from 'lucide-react';

interface RecordListProps {
  records: CaneTicket[];
  onDelete: (id: string) => void;
}

export const RecordList: React.FC<RecordListProps> = ({ records, onDelete }) => {
  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Scale size={48} className="mx-auto mb-3 opacity-20" />
        <p>ยังไม่มีรายการบันทึก</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24">
      {records.sort((a, b) => b.timestamp - a.timestamp).map((record) => (
        <RecordCard key={record.id} record={record} onDelete={onDelete} />
      ))}
    </div>
  );
};

const RecordCard: React.FC<{ record: CaneTicket; onDelete: (id: string) => void }> = ({ record, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
      {/* Main Row (Always Visible) */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer active:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 p-2.5 rounded-full text-green-700">
            <Truck size={18} />
          </div>
          <div>
            <div className="font-bold text-gray-800">{record.netWeightKg.toLocaleString()} กก.</div>
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <span>{record.date}</span>
              <span>•</span>
              <span>{record.licensePlate}</span>
            </div>
          </div>
        </div>
        <div className="text-gray-400">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="bg-gray-50 p-4 border-t border-gray-100 text-sm animate-fade-in">
          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <div className="col-span-2 flex items-start space-x-2 text-gray-600">
               <FileText size={14} className="mt-0.5" />
               <span className="font-medium">เลขที่: {record.ticketNumber}</span>
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
                 <span className="text-xs text-gray-400 block mb-1">รูปภาพต้นฉบับ</span>
                 <img src={record.imageUrl} alt="Original Slip" className="rounded-lg max-h-32 object-contain bg-gray-200" />
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if(confirm('ต้องการลบรายการนี้ใช่หรือไม่?')) onDelete(record.id);
              }}
              className="text-red-500 text-xs flex items-center space-x-1 hover:text-red-700 px-3 py-1 rounded-full hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              <span>ลบรายการ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
