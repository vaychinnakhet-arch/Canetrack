import React, { useState, useEffect } from 'react';
import { CaneTicket } from '../types';
import { Save, X, Droplets, Calculator, ChevronDown, ChevronUp } from 'lucide-react';

interface EditModalProps {
  ticket: CaneTicket;
  onSave: (updatedTicket: CaneTicket) => void;
  onClose: () => void;
  priceTable: (moisture: number) => number;
}

export const EditModal: React.FC<EditModalProps> = ({ ticket, onSave, onClose, priceTable }) => {
  const [formData, setFormData] = useState<CaneTicket>({ ...ticket });
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [showOtherDetails, setShowOtherDetails] = useState(false);

  useEffect(() => {
    // คำนวณราคาเริ่มต้น ถ้ามีค่าอยู่แล้ว หรือ ถ้ายังไม่มีให้เป็น 0
    const m = formData.moisture !== undefined ? Number(formData.moisture) : 0;
    if (m > 0) {
        const price = priceTable(m);
        setCalculatedPrice(price);
    }
  }, []);

  const handleMoistureChange = (value: number) => {
    const price = priceTable(value);
    setCalculatedPrice(price);
    setFormData(prev => ({ 
        ...prev, 
        moisture: value,
        canePrice: price, 
        totalValue: (prev.netWeightKg / 1000) * price 
    }));
  };

  const handleTextChange = (field: keyof CaneTicket, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const totalValueDisplay = formData.moisture && formData.moisture > 0 
    ? ((formData.netWeightKg / 1000) * calculatedPrice) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
           <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
             <Calculator size={20} className="text-blue-600"/> คำนวณราคาอ้อย
           </h3>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        <div className="p-6 space-y-6">
            {/* Ticket Info Summary */}
            <div className="text-center">
                 <div className="text-gray-500 text-sm mb-1">เลขที่ใบชั่ง: {formData.ticketNumber}</div>
                 <div className="text-3xl font-bold text-gray-800">
                    {formData.netWeightKg.toLocaleString()} <span className="text-lg text-gray-500 font-normal">กก.</span>
                 </div>
                 <div className="text-xs text-gray-400">({(formData.netWeightKg/1000).toFixed(2)} ตัน)</div>
            </div>

            {/* Moisture Input Section (Focus Area) */}
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-inner">
                <label className="text-base font-bold text-blue-800 flex items-center justify-center gap-2 mb-3">
                    <Droplets size={20} /> ระบุ % ความชื้น
                </label>
                <div className="relative">
                    <input 
                        type="number" 
                        step="0.01"
                        value={formData.moisture || ''}
                        onChange={(e) => handleMoistureChange(parseFloat(e.target.value))}
                        placeholder="0.00"
                        className="w-full text-center text-4xl font-bold text-blue-700 bg-white border-2 border-blue-200 rounded-xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-blue-200"
                        autoFocus
                    />
                </div>
                
                {/* Result Display */}
                <div className={`mt-6 transition-all duration-300 ${calculatedPrice > 0 ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/80 rounded-lg p-3 text-center border border-blue-100">
                            <div className="text-xs text-gray-500 mb-1">ราคาต่อตัน</div>
                            <div className="font-bold text-lg text-gray-800">{calculatedPrice.toLocaleString()} บ.</div>
                        </div>
                        <div className="bg-amber-100 rounded-lg p-3 text-center border border-amber-200 shadow-sm">
                            <div className="text-xs text-amber-700 mb-1 font-bold">มูลค่าสุทธิ</div>
                            <div className="font-bold text-lg text-amber-700">
                                {totalValueDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })} บ.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <button 
                onClick={() => onSave(formData)}
                disabled={!formData.moisture}
                className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${!formData.moisture ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
            >
                <Save size={20} /> บันทึกและคำนวณเงิน
            </button>

            {/* Other Details (Hidden by default) */}
            <div className="pt-4 border-t border-gray-100">
                <button 
                    onClick={() => setShowOtherDetails(!showOtherDetails)}
                    className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 py-2"
                >
                    {showOtherDetails ? 'ซ่อนข้อมูลอื่น' : 'แก้ไขข้อมูลอื่นๆ (ทะเบียนรถ, วันที่)'}
                    {showOtherDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showOtherDetails && (
                    <div className="grid grid-cols-2 gap-4 mt-4 animate-fade-in bg-gray-50 p-4 rounded-xl">
                        <div className="col-span-2 text-xs text-gray-400 mb-2">
                            * แก้ไขเฉพาะกรณีข้อมูลผิดพลาดจากการสแกน
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">เลขที่ใบชั่ง</label>
                            <input type="text" value={formData.ticketNumber} onChange={e => handleTextChange('ticketNumber', e.target.value)} className="w-full p-2 border rounded mt-1 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">ทะเบียนรถ</label>
                            <input type="text" value={formData.licensePlate} onChange={e => handleTextChange('licensePlate', e.target.value)} className="w-full p-2 border rounded mt-1 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">วันที่</label>
                            <input type="text" value={formData.date} onChange={e => handleTextChange('date', e.target.value)} className="w-full p-2 border rounded mt-1 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">เวลา</label>
                            <input type="text" value={formData.time} onChange={e => handleTextChange('time', e.target.value)} className="w-full p-2 border rounded mt-1 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">น้ำหนักสุทธิ (กก.)</label>
                            <input type="number" value={formData.netWeightKg} onChange={e => handleTextChange('netWeightKg', Number(e.target.value))} className="w-full p-2 border rounded mt-1 font-bold text-sm" />
                        </div>
                    </div>
                )}
            </div>
            
        </div>
      </div>
    </div>
  );
};