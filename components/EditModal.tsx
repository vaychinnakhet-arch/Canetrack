
import React, { useState, useEffect } from 'react';
import { CaneTicket } from '../types';
import { Save, X, Droplets, Calculator } from 'lucide-react';

interface EditModalProps {
  ticket: CaneTicket;
  onSave: (updatedTicket: CaneTicket) => void;
  onClose: () => void;
  priceTable: (moisture: number) => number;
}

export const EditModal: React.FC<EditModalProps> = ({ ticket, onSave, onClose, priceTable }) => {
  const [formData, setFormData] = useState<CaneTicket>({ ...ticket });
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

  useEffect(() => {
    if (formData.moisture !== undefined && formData.moisture !== null) {
        const price = priceTable(Number(formData.moisture));
        setCalculatedPrice(price);
        setFormData(prev => ({ ...prev, canePrice: price, totalValue: (prev.netWeightKg / 1000) * price }));
    }
  }, [formData.moisture, formData.netWeightKg, priceTable]);

  const handleChange = (field: keyof CaneTicket, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
           <h3 className="font-bold text-lg flex items-center gap-2">
             <Calculator size={20} className="text-blue-600"/> แก้ไขข้อมูล / คำนวณราคา
           </h3>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        <div className="p-6 space-y-4">
            {/* Moisture Input Section */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <label className="text-sm font-bold text-blue-800 flex items-center gap-1 mb-2">
                    <Droplets size={16} /> ความชื้น (%)
                </label>
                <input 
                    type="number" 
                    step="0.01"
                    value={formData.moisture || ''}
                    onChange={(e) => handleChange('moisture', parseFloat(e.target.value))}
                    placeholder="ระบุ % ความชื้น (เช่น 20.5)"
                    className="w-full text-center text-3xl font-bold text-blue-700 bg-white border border-blue-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                />
                
                {formData.moisture !== undefined && (
                    <div className="mt-3 grid grid-cols-2 gap-4 text-center">
                        <div className="bg-white rounded p-2">
                            <div className="text-xs text-gray-500">ราคา/ตัน</div>
                            <div className="font-bold text-lg text-gray-800">{calculatedPrice} บ.</div>
                        </div>
                        <div className="bg-amber-100 rounded p-2 border border-amber-200">
                            <div className="text-xs text-amber-700">มูลค่ารวม</div>
                            <div className="font-bold text-lg text-amber-700">
                                {((formData.netWeightKg / 1000) * calculatedPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })} บ.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <hr className="border-gray-100" />

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-500">เลขที่ใบชั่ง</label>
                    <input type="text" value={formData.ticketNumber} onChange={e => handleChange('ticketNumber', e.target.value)} className="w-full p-2 border rounded mt-1" />
                </div>
                <div>
                    <label className="text-xs text-gray-500">ทะเบียนรถ</label>
                    <input type="text" value={formData.licensePlate} onChange={e => handleChange('licensePlate', e.target.value)} className="w-full p-2 border rounded mt-1" />
                </div>
                <div>
                    <label className="text-xs text-gray-500">วันที่</label>
                    <input type="text" value={formData.date} onChange={e => handleChange('date', e.target.value)} className="w-full p-2 border rounded mt-1" />
                </div>
                <div>
                    <label className="text-xs text-gray-500">น้ำหนักสุทธิ (กก.)</label>
                    <input type="number" value={formData.netWeightKg} onChange={e => handleChange('netWeightKg', Number(e.target.value))} className="w-full p-2 border rounded mt-1 font-bold" />
                </div>
            </div>
            
            <button 
                onClick={() => onSave(formData)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2 shadow-lg"
            >
                <Save size={20} /> บันทึกการเปลี่ยนแปลง
            </button>
        </div>
      </div>
    </div>
  );
};
