import React, { useState, useRef } from 'react';
import { Camera, Upload, Check, X, Loader2, Save, AlertTriangle } from 'lucide-react';
import { analyzeTicketImage } from '../services/geminiService';
import { CaneTicket } from '../types';

interface ScannerProps {
  onSave: (ticket: CaneTicket) => void;
  onCancel: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onSave, onCancel }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<Partial<CaneTicket> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImage(base64String);
        performAnalysis(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const performAnalysis = async (base64Img: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeTicketImage(base64Img);
      setAnalyzedData(result);
    } catch (error: any) {
      console.error("Analysis Error:", error);
      
      let errorMessage = "ไม่สามารถอ่านข้อมูลได้ กรุณาลองใหม่อีกครั้ง หรือกรอกข้อมูลเอง";
      let errorDetail = "";

      // Check specific error messages
      if (error.message === "API Key is missing") {
         errorMessage = "⚠️ ไม่พบ API Key บน Server!";
         errorDetail = "กรุณาไปที่ Vercel > Settings > Environment Variables แล้วเพิ่ม 'API_KEY'";
      } else if (error.message?.includes("400") || error.message?.includes("API key not valid")) {
         errorMessage = "⚠️ API Key ไม่ถูกต้อง (Invalid Key)";
         errorDetail = "กรุณาตรวจสอบว่า Copy Key มาครบถ้วนหรือไม่";
      } else if (error.message?.includes("429") || error.message?.includes("Quota")) {
         errorMessage = "⚠️ ใช้งานเกินโควต้า (Quota Exceeded)";
         errorDetail = "API Key นี้ใช้งานเกินลิมิตฟรีของ Google แล้ว";
      } else if (error.message) {
         // Show the actual error for debugging
         errorMessage = `เกิดข้อผิดพลาดจาก AI: ${error.message}`;
      }

      alert(`${errorMessage}\n\n${errorDetail}`);

      // Fallback to empty form
      setAnalyzedData({
        netWeightKg: 0,
        ticketNumber: "",
        licensePlate: "",
        vendorName: "",
        productName: "อ้อยสด",
        date: new Date().toLocaleDateString('th-TH'),
        time: new Date().toLocaleTimeString('th-TH')
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (analyzedData) {
      const ticket: CaneTicket = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        ticketNumber: analyzedData.ticketNumber || "-",
        date: analyzedData.date || "",
        time: analyzedData.time || "",
        netWeightKg: Number(analyzedData.netWeightKg) || 0,
        grossWeightKg: Number(analyzedData.grossWeightKg) || 0,
        tareWeightKg: Number(analyzedData.tareWeightKg) || 0,
        licensePlate: analyzedData.licensePlate || "-",
        vendorName: analyzedData.vendorName || "-",
        productName: analyzedData.productName || "อ้อย",
        imageUrl: image || undefined
      };
      onSave(ticket);
    }
  };

  const handleInputChange = (field: keyof CaneTicket, value: any) => {
    setAnalyzedData(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  if (!image) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 space-y-6 animate-fade-in">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm text-center">
          <div className="bg-green-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Camera size={40} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">สแกนใบชั่งอ้อย</h2>
          <p className="text-gray-500 mb-8">ถ่ายภาพหรืออัปโหลดรูปภาพใบเสร็จเพื่อบันทึกข้อมูลอัตโนมัติด้วย AI</p>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-green-200"
          >
            <Camera size={24} />
            <span>ถ่ายภาพ / เลือกรูป</span>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          
          <button 
            onClick={onCancel}
            className="mt-4 text-gray-400 hover:text-gray-600 font-medium text-sm"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white animate-fade-in pb-20">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
        <button onClick={() => setImage(null)} className="p-2 text-gray-500">
          <X size={24} />
        </button>
        <h2 className="font-bold text-lg">ตรวจสอบข้อมูล</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Image Preview */}
        <div className="mb-6 rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-gray-50">
          <img src={image} alt="Slip" className="w-full object-contain max-h-60" />
        </div>

        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 text-green-600">
            <Loader2 size={48} className="animate-spin" />
            <p className="font-medium">กำลังอ่านข้อมูลด้วย AI...</p>
          </div>
        ) : analyzedData ? (
          <div className="space-y-4">
             <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <label className="text-xs font-bold text-green-800 uppercase">น้ำหนักสุทธิ (กิโลกรัม)</label>
                <input 
                  type="number" 
                  value={analyzedData.netWeightKg} 
                  onChange={(e) => handleInputChange('netWeightKg', e.target.value)}
                  className="w-full text-3xl font-bold text-green-700 bg-transparent outline-none mt-1"
                />
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs text-gray-500">วันที่</label>
                  <input 
                    type="text" 
                    value={analyzedData.date} 
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full p-2 border rounded-lg mt-1"
                  />
               </div>
               <div>
                  <label className="text-xs text-gray-500">เวลา</label>
                  <input 
                    type="text" 
                    value={analyzedData.time} 
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    className="w-full p-2 border rounded-lg mt-1"
                  />
               </div>
             </div>

             <div>
                <label className="text-xs text-gray-500">เลขที่ใบชั่ง</label>
                <input 
                  type="text" 
                  value={analyzedData.ticketNumber} 
                  onChange={(e) => handleInputChange('ticketNumber', e.target.value)}
                  className="w-full p-2 border rounded-lg mt-1"
                />
             </div>

             <div>
                <label className="text-xs text-gray-500">ทะเบียนรถ</label>
                <input 
                  type="text" 
                  value={analyzedData.licensePlate} 
                  onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                  className="w-full p-2 border rounded-lg mt-1"
                />
             </div>

             <div>
                <label className="text-xs text-gray-500">ชื่อสินค้า</label>
                <input 
                  type="text" 
                  value={analyzedData.productName} 
                  onChange={(e) => handleInputChange('productName', e.target.value)}
                  className="w-full p-2 border rounded-lg mt-1"
                />
             </div>

             <div className="pt-2">
                <button 
                  onClick={() => {
                    // Toggle showing advanced fields or just always show them in form
                  }}
                  className="text-xs text-gray-400 underline"
                >
                  รายละเอียดเพิ่มเติม (น้ำหนักรวม/รถ)
                </button>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="text-xs text-gray-400">น้ำหนักรวม</label>
                    <input 
                      type="number" 
                      value={analyzedData.grossWeightKg} 
                      onChange={(e) => handleInputChange('grossWeightKg', e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg mt-1 text-sm text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">น้ำหนักรถ</label>
                    <input 
                      type="number" 
                      value={analyzedData.tareWeightKg} 
                      onChange={(e) => handleInputChange('tareWeightKg', e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg mt-1 text-sm text-gray-600"
                    />
                  </div>
                </div>
             </div>
          </div>
        ) : null}
      </div>

      {!isAnalyzing && analyzedData && (
        <div className="p-4 bg-white border-t sticky bottom-0 z-10">
          <button 
            onClick={handleSave}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg"
          >
            <Save size={20} />
            <span>บันทึกข้อมูล</span>
          </button>
        </div>
      )}
    </div>
  );
};