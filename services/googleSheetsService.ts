import { CaneTicket } from '../types';

// ==========================================
// 🔴 ฝัง URL ของคุณตรงนี้แล้ว 🔴
const FIXED_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbym2WrMT6N-BVAoCTyN9aIK1hcGlQBcL5FsiSKwTWq90VwFX0yaG5AnicmQamvK2vo/exec"; 
// ==========================================

// ฟังก์ชันแปลงวันที่จาก ISO String ยาวๆ ให้เป็นรูปแบบสั้น (วว/ดด/ปปปป)
const formatSheetDate = (dateVal: any): string => {
  if (!dateVal) return "";
  const str = String(dateVal);
  if (str.includes('T') || str.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
          const d = new Date(str);
          if (isNaN(d.getTime())) return str;
          
          let year = d.getFullYear();
          const displayYear = year < 2400 ? year + 543 : year;
          
          return `${d.getDate()}/${d.getMonth() + 1}/${displayYear}`;
      } catch (e) {
          return str;
      }
  }
  return str;
};

// ฟังก์ชันแปลงเวลาจาก ISO String ให้เป็น HH:mm
const formatSheetTime = (timeVal: any): string => {
  if (!timeVal) return "";
  const str = String(timeVal);
  if (str.includes('T')) {
      try {
          const d = new Date(str);
          if (isNaN(d.getTime())) return str;
          return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
      } catch {
          return str;
      }
  }
  return str;
};

export const syncToGoogleSheets = async (ticket: CaneTicket, isUpdate: boolean = false): Promise<boolean> => {
  if (!FIXED_SCRIPT_URL || FIXED_SCRIPT_URL.includes("PASTE_YOUR_SCRIPT_URL_HERE")) {
    console.warn("Invalid Script URL");
    return false;
  }

  // ✅ เตรียมข้อมูลรูปภาพ
  let finalImageBase64 = "";
  if (ticket.imageUrl && ticket.imageUrl.startsWith("data:image")) {
      try {
          finalImageBase64 = ticket.imageUrl.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");
      } catch (e) {
          console.error("Image processing failed:", e);
      }
  }

  const payload = {
    action: isUpdate ? 'update' : 'create', // Support update action
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    date: ticket.date,
    time: ticket.time,
    netWeightKg: ticket.netWeightKg,
    grossWeightKg: ticket.grossWeightKg || 0,
    tareWeightKg: ticket.tareWeightKg || 0,
    licensePlate: ticket.licensePlate,
    vendorName: ticket.vendorName,
    productName: ticket.productName,
    goalTarget: ticket.goalTarget || 0,
    goalRound: ticket.goalRound || 1,
    moisture: ticket.moisture || 0,
    canePrice: ticket.canePrice || 0,
    totalValue: ticket.totalValue || 0,
    imageBase64: finalImageBase64 
  };

  try {
    await fetch(FIXED_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (error) {
    console.error("Error syncing to Google Sheets:", error);
    return false;
  }
};

export const deleteFromGoogleSheets = async (ticketNumber: string): Promise<boolean> => {
  if (!FIXED_SCRIPT_URL) return false;

  const payload = {
    action: 'delete',
    ticketNumber: ticketNumber.trim()
  };

  try {
    await fetch(FIXED_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (error) {
    console.error("Error deleting from Google Sheets:", error);
    return false;
  }
};

export const fetchFromGoogleSheets = async (): Promise<CaneTicket[] | null> => {
  if (!FIXED_SCRIPT_URL || FIXED_SCRIPT_URL.includes("PASTE_YOUR_SCRIPT_URL_HERE")) {
    console.error("URL not configured");
    return null;
  }

  try {
    const url = `${FIXED_SCRIPT_URL}?action=read&t=${Date.now()}`;
    
    const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow'
    });
    
    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) return [];

    return data.map((item: any, index: number) => ({
      id: item.id || `sheet-${index}-${Date.now()}`,
      ticketNumber: item.ticketNumber?.toString() || "-",
      date: formatSheetDate(item.date),
      time: formatSheetTime(item.time),
      netWeightKg: Number(String(item.netWeightKg).replace(/,/g, '')) || 0,
      grossWeightKg: Number(String(item.grossWeightKg).replace(/,/g, '')) || 0,
      tareWeightKg: Number(String(item.tareWeightKg).replace(/,/g, '')) || 0,
      licensePlate: item.licensePlate || "-",
      vendorName: item.vendorName || "-",
      productName: item.productName || "อ้อย",
      goalTarget: Number(item.goalTarget) || 0,
      goalRound: Number(item.goalRound) || 1,
      // Map new fields
      moisture: item.moisture ? Number(item.moisture) : undefined,
      canePrice: item.canePrice ? Number(item.canePrice) : undefined,
      totalValue: item.totalValue ? Number(item.totalValue) : undefined,
      imageUrl: item.imageUrl && item.imageUrl.startsWith("http") ? item.imageUrl : undefined,
      timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now()
    }));
  } catch (error) {
    console.error("Error fetching from Google Sheets:", error);
    return null;
  }
};
