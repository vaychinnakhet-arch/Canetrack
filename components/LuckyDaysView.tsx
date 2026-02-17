import React from 'react';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Calendar, Star } from 'lucide-react';

interface LuckyDaysViewProps {
  onBack: () => void;
}

export interface LuckyEvent {
  dateStr: string; // d/m
  dayLabel: string; // e.g., ศุกร์ 20 ก.พ.
  type: 'good' | 'bad';
  action: string;
  description?: string;
  specialTag?: string; // e.g., วันนาทีทอง
  month: number; // 2, 3, 4
  day: number;
}

// Data extracted from images (Year 2025/2568)
export const LUCKY_EVENTS: LuckyEvent[] = [
  // --- February ---
  { dateStr: '19/2', day: 19, month: 2, dayLabel: 'พฤหัส 19 ก.พ.', type: 'bad', action: 'เลี่ยง: รับปากผู้ใหญ่, เซ็นค้ำประกัน', description: 'ระวัง: โดนเอาเปรียบสัญญา' },
  { dateStr: '20/2', day: 20, month: 2, dayLabel: 'ศุกร์ 20 ก.พ.', type: 'good', action: 'ทวงหนี้, วางบิล, เอารถเข้าเช็คระยะ' },
  { dateStr: '26/2', day: 26, month: 2, dayLabel: 'พฤหัส 26 ก.พ.', type: 'bad', action: 'เลี่ยง: รับปากผู้ใหญ่, เซ็นค้ำประกัน', description: 'ระวัง: โดนเอาเปรียบสัญญา' },
  { dateStr: '27/2', day: 27, month: 2, dayLabel: 'ศุกร์ 27 ก.พ.', type: 'good', action: 'เคลียร์บัญชีสิ้นเดือน, ปิดยอดเงินสด' },

  // --- March ---
  { dateStr: '1/3', day: 1, month: 3, dayLabel: 'อาทิตย์ 1 มี.ค.', type: 'bad', action: 'ห้าม: เอารถไปซ่อมหนัก (ซ่อมไม่จบ), ออกรถใหม่', description: 'ระวัง: เครื่องจักรพังหน้างาน, อุบัติเหตุเล็กน้อย' },
  { dateStr: '5/3', day: 5, month: 3, dayLabel: 'พฤหัส 5 มี.ค.', type: 'bad', action: 'เลี่ยง: เจรจาเรื่องเงิน', description: 'ระวัง: พูดจาผิดหูผู้ใหญ่' },
  { dateStr: '6/3', day: 6, month: 3, dayLabel: 'ศุกร์ 6 มี.ค.', type: 'good', action: 'นัดคุยงานทั่วไป, วางบิลรับเช็ค' },
  { dateStr: '8/3', day: 8, month: 3, dayLabel: 'อาทิตย์ 8 มี.ค.', type: 'bad', action: 'ห้าม: เอารถไปซ่อมหนัก (ซ่อมไม่จบ), ออกรถใหม่', description: 'ระวัง: เครื่องจักรพังหน้างาน, อุบัติเหตุเล็กน้อย' },
  { dateStr: '10/3', day: 10, month: 3, dayLabel: 'อังคาร 10 มี.ค.', type: 'good', action: 'ไหว้ขอพรที่วัดซานหยวนกง (กวางโจว)', specialTag: 'วันพิเศษ' },
  { dateStr: '12/3', day: 12, month: 3, dayLabel: 'พฤหัส 12 มี.ค.', type: 'bad', action: 'เลี่ยง: เจรจาเรื่องเงิน', description: 'ระวัง: พูดจาผิดหูผู้ใหญ่' },
  { dateStr: '13/3', day: 13, month: 3, dayLabel: 'ศุกร์ 13 มี.ค.', type: 'good', action: 'นัดคุยงานทั่วไป, วางบิลรับเช็ค' },
  { dateStr: '15/3', day: 15, month: 3, dayLabel: 'อาทิตย์ 15 มี.ค.', type: 'bad', action: 'ห้าม: เอารถไปซ่อมหนัก (ซ่อมไม่จบ), ออกรถใหม่', description: 'ระวัง: เครื่องจักรพังหน้างาน, อุบัติเหตุเล็กน้อย' },
  { dateStr: '19/3', day: 19, month: 3, dayLabel: 'พฤหัส 19 มี.ค.', type: 'bad', action: 'เลี่ยง: เจรจาเรื่องเงิน', description: 'ระวัง: พูดจาผิดหูผู้ใหญ่' },
  { dateStr: '20/3', day: 20, month: 3, dayLabel: 'ศุกร์ 20 มี.ค.', type: 'good', action: 'นัดคุยงานทั่วไป, วางบิลรับเช็ค' },
  { dateStr: '22/3', day: 22, month: 3, dayLabel: 'อาทิตย์ 22 มี.ค.', type: 'bad', action: 'ห้าม: เอารถไปซ่อมหนัก (ซ่อมไม่จบ), ออกรถใหม่', description: 'ระวัง: เครื่องจักรพังหน้างาน, อุบัติเหตุเล็กน้อย' },
  { dateStr: '26/3', day: 26, month: 3, dayLabel: 'พฤหัส 26 มี.ค.', type: 'bad', action: 'เลี่ยง: เจรจาเรื่องเงิน', description: 'ระวัง: พูดจาผิดหูผู้ใหญ่' },
  { dateStr: '27/3', day: 27, month: 3, dayLabel: 'ศุกร์ 27 มี.ค.', type: 'good', action: 'ให้กิตติพงษ์นัดผู้ใหญ่คุยดีลใหญ่, เซ็นสัญญาสำคัญ', specialTag: 'วันมหาเฮง ⭐' },
  { dateStr: '29/3', day: 29, month: 3, dayLabel: 'อาทิตย์ 29 มี.ค.', type: 'bad', action: 'ห้าม: เอารถไปซ่อมหนัก (ซ่อมไม่จบ), ออกรถใหม่', description: 'ระวัง: เครื่องจักรพังหน้างาน, อุบัติเหตุเล็กน้อย' },

  // --- April ---
  { dateStr: '2/4', day: 2, month: 4, dayLabel: 'พฤหัส 2 เม.ย.', type: 'bad', action: 'เลี่ยง: เร่งงานลูกน้อง (จะทะเลาะกัน)' },
  { dateStr: '3/4', day: 3, month: 4, dayLabel: 'ศุกร์ 3 เม.ย.', type: 'good', action: 'ต้องปิดดีลให้จบวันนี้ (ก่อนหยุดยาว), รับเงินก้อน', specialTag: 'วันนาทีทอง ⭐' },
  { dateStr: '5/4', day: 5, month: 4, dayLabel: 'อาทิตย์ 5 เม.ย.', type: 'bad', action: 'ห้าม: ซ่อมรถ' },
  { dateStr: '9/4', day: 9, month: 4, dayLabel: 'พฤหัส 9 เม.ย.', type: 'bad', action: 'เลี่ยง: เร่งงานลูกน้อง (จะทะเลาะกัน)' },
  { dateStr: '10/4', day: 10, month: 4, dayLabel: 'ศุกร์ 10 เม.ย.', type: 'good', action: 'เก็บตกงานเอกสาร, จ่ายโบนัสลูกน้อง' },
  { dateStr: '12/4', day: 12, month: 4, dayLabel: '12-14 เม.ย.', type: 'bad', action: 'ห้าม: ด่าว่าลูกน้อง, พูดคำหยาบ', description: 'ระวัง: ถ้าปากเสียวันนี้ จะซวยเรื่องคนไปตลอดปี', specialTag: 'วันเนา-สงกรานต์' },
  { dateStr: '17/4', day: 17, month: 4, dayLabel: 'ศุกร์ 17 เม.ย.', type: 'good', action: 'เริ่มงานวันแรก, เปิดกล้องหน้ารถใหม่เอาฤกษ์', specialTag: 'หลังสงกรานต์' },
  { dateStr: '20/4', day: 20, month: 4, dayLabel: 'จันทร์ 20 เม.ย.', type: 'good', action: 'เซ็นสัญญาจ้างงาน, รับเงินก้อนโต', specialTag: 'วันธงชัยใหม่' },
  { dateStr: '26/4', day: 26, month: 4, dayLabel: 'อาทิตย์ 26 เม.ย.', type: 'bad', action: 'ห้าม: ซ่อมรถ' },
  { dateStr: '27/4', day: 27, month: 4, dayLabel: 'จันทร์ 27 เม.ย.', type: 'good', action: 'เซ็นสัญญาจ้างงาน, รับเงินก้อนโต', specialTag: 'วันธงชัยใหม่' },
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
            ปฏิทินวันดี / วันเสีย
          </h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {[2, 3, 4].map(month => (
          <div key={month} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`px-4 py-3 font-bold text-lg border-b ${month === currentMonth ? 'bg-pink-50 text-pink-700' : 'bg-gray-50 text-gray-700'}`}>
              เดือน{thaiMonths[month]}
            </div>
            <div className="divide-y divide-gray-50">
              {groupedEvents[month]?.map((event, idx) => (
                <div key={idx} className="p-4 flex gap-3">
                  <div className="pt-1">
                    {event.type === 'good' ? (
                      <CheckCircle className="text-green-500" size={24} />
                    ) : (
                      <XCircle className="text-red-500" size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold text-base ${event.type === 'good' ? 'text-green-800' : 'text-red-800'}`}>
                        {event.dayLabel}
                      </span>
                      {event.specialTag && (
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-200 font-bold flex items-center gap-1">
                           <Star size={8} fill="currentColor" /> {event.specialTag}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-700 font-medium mb-1">
                       {event.type === 'good' ? '✅ ทำ: ' : '❌ เลี่ยง/ห้าม: '}
                       {event.action}
                    </div>

                    {event.description && (
                       <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded flex items-start gap-1 mt-1">
                          <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-500" />
                          <span>{event.description}</span>
                       </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
