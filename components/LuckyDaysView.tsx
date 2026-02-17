import React from 'react';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Calendar, Star, Circle, Ban, Flame } from 'lucide-react';

interface LuckyDaysViewProps {
  onBack: () => void;
}

export interface LuckyEvent {
  dateStr: string; // d/m
  dayLabel: string; // e.g., ศุกร์ 20 ก.พ.
  type: 'good' | 'bad'; // Used for general good/bad logic in App.tsx
  markerColor: 'green' | 'blue' | 'purple' | 'amber' | 'red' | 'yellow' | 'orange'; // Specific visualization
  action: string;
  description?: string;
  specialTag?: string; // e.g., วันนาทีทอง
  month: number; // 2, 3, 4
  day: number;
}

// Data Updated for 17 Feb - 30 Apr 2569 (2026)
export const LUCKY_EVENTS: LuckyEvent[] = [
  // --- กุมภาพันธ์ (โค้งสุดท้าย) ---
  { dateStr: '17/2', day: 17, month: 2, dayLabel: 'อังคาร 17 ก.พ.', type: 'good', markerColor: 'green', action: 'ติดต่อผู้ใหญ่ด่วน', specialTag: 'ดีมาก' },
  { dateStr: '20/2', day: 20, month: 2, dayLabel: 'ศุกร์ 20 ก.พ.', type: 'bad', markerColor: 'amber', action: 'ห้ามเซ็นเอกสาร ให้กิตติพงษ์ทำแทน', specialTag: 'ระวัง (คุณนิวัฒน์)' },
  { dateStr: '21/2', day: 21, month: 2, dayLabel: 'เสาร์ 21 ก.พ.', type: 'good', markerColor: 'blue', action: 'เหมาะเช็คเครื่องจักร ซ่อมรถแล้วจบ', specialTag: 'วันแข็ง' },
  { dateStr: '24/2', day: 24, month: 2, dayLabel: 'อังคาร 24 ก.พ.', type: 'good', markerColor: 'green', action: 'ทวงหนี้ได้เงิน คุยงานได้เปรียบ', specialTag: 'ดีมาก' },
  { dateStr: '26/2', day: 26, month: 2, dayLabel: 'พฤหัส 26 ก.พ.', type: 'good', markerColor: 'purple', action: 'คุยงานเอกสารได้', specialTag: 'วันกลางๆ' },
  { dateStr: '28/2', day: 28, month: 2, dayLabel: 'เสาร์ 28 ก.พ.', type: 'good', markerColor: 'blue', action: 'วางแผนงานเดินรถเดือนหน้า', specialTag: 'วันแข็ง' },

  // --- มีนาคม (เดือนแห่งการต่อสู้) ---
  { dateStr: '3/3', day: 3, month: 3, dayLabel: 'อังคาร 3 มี.ค.', type: 'good', markerColor: 'green', action: 'นัดคุยราคาได้เลย', specialTag: 'ดีเยี่ยม (ดาวอังคารมีพลัง)' },
  { dateStr: '6/3', day: 6, month: 3, dayLabel: 'ศุกร์ 6 มี.ค.', type: 'bad', markerColor: 'red', action: 'คุณนิวัฒน์พักผ่อน ห้ามยุ่งเรื่องเงิน', specialTag: 'หยุด' },
  { dateStr: '7/3', day: 7, month: 3, dayLabel: 'เสาร์ 7 มี.ค.', type: 'good', markerColor: 'blue', action: 'เอารถเข้าอู่ ซ่อมบำรุงใหญ่', specialTag: 'วันเครื่องจักร' },
  { dateStr: '10/3', day: 10, month: 3, dayLabel: 'อังคาร 10 มี.ค.', type: 'good', markerColor: 'yellow', action: 'ขอพร + โทรหาผู้ใหญ่จากเมืองจีน', description: 'อยู่วัดซานหยวนกง', specialTag: 'ดีที่สุดของเดือน ⭐' },
  { dateStr: '13/3', day: 13, month: 3, dayLabel: 'ศุกร์ 13 มี.ค.', type: 'bad', markerColor: 'amber', action: 'ระวังเอกสารผิดพลาด', specialTag: 'ระวัง' },
  { dateStr: '14/3', day: 14, month: 3, dayLabel: 'เสาร์ 14 มี.ค.', type: 'good', markerColor: 'blue', action: 'เหมาะเคลียร์งานหน้าไซต์', specialTag: 'ดี' },
  { dateStr: '17/3', day: 17, month: 3, dayLabel: 'อังคาร 17 มี.ค.', type: 'good', markerColor: 'green', action: 'เงินเข้าหมุนเวียนดี', specialTag: 'ดีมาก' },
  { dateStr: '21/3', day: 21, month: 3, dayLabel: 'เสาร์ 21 มี.ค.', type: 'good', markerColor: 'blue', action: 'ซื้ออะไหล่ล็อตใหญ่ได้ของดี', specialTag: 'ดี' },
  { dateStr: '24/3', day: 24, month: 3, dayLabel: 'อังคาร 24 มี.ค.', type: 'good', markerColor: 'green', action: 'เร่งปิดยอดเดือน', specialTag: 'ดีมาก' },
  { dateStr: '27/3', day: 27, month: 3, dayLabel: 'ศุกร์ 27 มี.ค.', type: 'bad', markerColor: 'red', action: 'ห้ามเซ็น! เลื่อนไปเซ็นวันอื่น', description: 'แม้สากลจะบอกว่าดี แต่ดวงคุณคือวันมรณะ' },
  { dateStr: '31/3', day: 31, month: 3, dayLabel: 'อังคาร 31 มี.ค.', type: 'good', markerColor: 'green', action: 'ปิดงบสวยๆ', specialTag: 'ดีส่งท้าย' },

  // --- เมษายน (เดือนเปลี่ยนชีวิต / ปิดดีล) ---
  { dateStr: '3/4', day: 3, month: 4, dayLabel: 'ศุกร์ 3 เม.ย.', type: 'bad', markerColor: 'amber', action: 'ให้กิตติพงษ์ลุยเดี่ยว คุณรอฟังข่าวดีที่บ้านพอ', description: 'ถ้าต้องปิดดีลวันนี้', specialTag: 'ระวัง' },
  { dateStr: '4/4', day: 4, month: 4, dayLabel: 'เสาร์ 4 เม.ย.', type: 'good', markerColor: 'blue', action: 'เช็คความพร้อมรถก่อนหยุดยาว', specialTag: 'ดี' },
  { dateStr: '7/4', day: 7, month: 4, dayLabel: 'อังคาร 7 เม.ย.', type: 'good', markerColor: 'green', action: 'ตามงานสุดท้าย เก็บเงินก่อนสงกรานต์', specialTag: 'ดีมาก' },
  { dateStr: '11/4', day: 11, month: 4, dayLabel: 'เสาร์ 11 เม.ย.', type: 'good', markerColor: 'blue', action: 'จ่ายโบนัสลูกน้อง (จะได้ใจมาก)', specialTag: 'ดี' },
  { dateStr: '14/4', day: 14, month: 4, dayLabel: 'อังคาร 14 เม.ย.', type: 'good', markerColor: 'yellow', action: 'โทรสวัสดีผู้ใหญ่เปิดทางรับงานใหญ่', description: 'วันเปลี่ยนดวง ดาวอาทิตย์เป็นมหาอุจจ์', specialTag: 'วันมหาสงกรานต์ ⭐' },
  { dateStr: '18/4', day: 18, month: 4, dayLabel: 'เสาร์ 18 เม.ย.', type: 'good', markerColor: 'blue', action: 'เริ่มเดินเครื่องจักรเต็มกำลัง', specialTag: 'วันดีหลังปีใหม่' },
  { dateStr: '21/4', day: 21, month: 4, dayLabel: 'อังคาร 21 เม.ย.', type: 'good', markerColor: 'orange', action: 'นัดเซ็นสัญญาจ้างงาน / รับเงินก้อนใหญ่', description: 'ดาวส่งพลังให้ทั้งคุณและกิตติพงษ์สูงสุด', specialTag: 'วันพีคที่สุด 🔥' },
  { dateStr: '25/4', day: 25, month: 4, dayLabel: 'เสาร์ 25 เม.ย.', type: 'good', markerColor: 'blue', action: 'ตรวจเช็คหน้างาน', specialTag: 'ดี' },
  { dateStr: '28/4', day: 28, month: 4, dayLabel: 'อังคาร 28 เม.ย.', type: 'good', markerColor: 'green', action: 'สรุปยอดสิ้นเดือน', specialTag: 'ดี' },
];

export const LuckyDaysView: React.FC<LuckyDaysViewProps> = ({ onBack }) => {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  // Group by Month
  const groupedEvents = LUCKY_EVENTS.reduce((acc, event) => {
    const key = event.month;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {} as Record<number, LuckyEvent[]>);

  const thaiMonths = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม"];
  const monthSubtitles: Record<number, string> = {
      2: "(โค้งสุดท้าย)",
      3: "(เดือนแห่งการต่อสู้)",
      4: "(เดือนเปลี่ยนชีวิต / ปิดดีล)"
  };

  // Helper to render icon based on color
  const renderIcon = (color: string) => {
      switch(color) {
          case 'green': return <div className="w-6 h-6 rounded-full bg-green-500 shadow-sm border-2 border-green-100" />;
          case 'blue': return <div className="w-6 h-6 rounded-full bg-blue-500 shadow-sm border-2 border-blue-100" />;
          case 'purple': return <div className="w-6 h-6 rounded-full bg-purple-400 shadow-sm border-2 border-purple-100" />;
          case 'red': return <div className="w-6 h-6 rounded-full bg-red-500 shadow-sm border-2 border-red-100 flex items-center justify-center text-white"><Ban size={14} /></div>;
          case 'amber': return <AlertTriangle className="text-amber-500" size={24} />;
          case 'yellow': return <Star className="text-yellow-500 fill-yellow-500" size={24} />;
          case 'orange': return <Flame className="text-orange-500 fill-orange-500" size={24} />;
          default: return <Circle className="text-gray-400" size={24} />;
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 animate-fade-in">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
        <div className="max-w-md mx-auto p-4 flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-pink-600" />
            ปฏิทินวันดี / วันเสีย (2569)
          </h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {[2, 3, 4].map(month => (
          <div key={month} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`px-4 py-3 border-b flex justify-between items-baseline ${month === currentMonth ? 'bg-pink-50 text-pink-700' : 'bg-gray-50 text-gray-700'}`}>
              <span className="font-bold text-lg">เดือน{thaiMonths[month]}</span>
              <span className="text-xs opacity-70 font-medium">{monthSubtitles[month]}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {groupedEvents[month]?.map((event, idx) => (
                <div key={idx} className="p-4 flex gap-4">
                  <div className="pt-1 shrink-0">
                    {renderIcon(event.markerColor)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`font-bold text-base text-gray-800`}>
                        {event.dayLabel}
                      </span>
                      {event.specialTag && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1
                            ${event.markerColor === 'red' ? 'bg-red-50 text-red-600 border-red-100' : 
                              event.markerColor === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                              event.markerColor === 'orange' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                              'bg-green-50 text-green-700 border-green-100'}
                        `}>
                           {event.specialTag}
                        </span>
                      )}
                    </div>
                    
                    <div className={`text-sm font-medium mb-1 ${event.type === 'bad' ? 'text-red-700' : 'text-gray-700'}`}>
                       {event.action}
                    </div>

                    {event.description && (
                       <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded flex items-start gap-1 mt-1 border border-gray-100">
                          <span className="font-bold opacity-50">•</span>
                          <span>{event.description}</span>
                       </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="text-center text-xs text-gray-400 pb-4">
            ข้อมูลสำหรับปี 2569 (2026)
        </div>
      </div>
    </div>
  );
};
