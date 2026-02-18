import { GoogleGenAI, Type } from "@google/genai";
import { CaneTicket } from "../types";

const getAiClient = () => {
  // ⚠️ SECURITY UPDATE: Always use environment variables, never hardcode API keys.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("API Key is missing. Please check your .env file or environment configuration.");
    throw new Error("API Key is missing");
  }
  
  return new GoogleGenAI({ apiKey });
};

export const analyzeTicketImage = async (base64Image: string): Promise<any> => {
  const ai = getAiClient();
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
          {
            text: `Analyze this weighbridge ticket (ใบชั่งน้ำหนัก) image from a sugar factory. 
            Extract the following information carefully in Thai.
            Ensure 'netWeightKg' is a number (remove commas).
            
            Fields to find:
            - Ticket Number (เลขที่ใบชั่ง)
            - Date (วัน เดือน ปี)
            - Time (เวลา)
            - Net Weight (น้ำหนักสุทธิ) in KG
            - Gross Weight (น้ำหนักรวม) in KG
            - Tare Weight (น้ำหนักรถ) in KG
            - License Plate (ทะเบียนรถ)
            - Vendor/Farmer Name (ชื่อลูกค้า/ชาวไร่)
            - Product Name (ชื่อสินค้า)
            
            If a field is not found, use an empty string or 0.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ticketNumber: { type: Type.STRING },
            date: { type: Type.STRING },
            time: { type: Type.STRING },
            netWeightKg: { type: Type.NUMBER },
            grossWeightKg: { type: Type.NUMBER },
            tareWeightKg: { type: Type.NUMBER },
            licensePlate: { type: Type.STRING },
            vendorName: { type: Type.STRING },
            productName: { type: Type.STRING },
          },
          required: ["netWeightKg", "ticketNumber", "licensePlate"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};

export interface AiTrendAnalysis {
  sustainableDailyRate: number;
  stableWeightPerTrip: number;
  tripBehavior: string;
  reasoning: string;
  // New fields for Lucky Day Analysis
  luckyDayCorrelation?: string; 
  avgLuckyDay?: number;
  avgUnluckyDay?: number;
}

// Update signature to accept lucky events
export const analyzeProductionTrend = async (records: CaneTicket[], luckyEvents: any[] = []): Promise<AiTrendAnalysis> => {
  const ai = getAiClient();

  // 1. Pre-process Data for Trip Analysis & Lucky Analysis
  const dailyStats: Record<string, { totalWeight: number, tripCount: number, weights: number[] }> = {};

  records.forEach(r => {
      const dateKey = r.date; 
      if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = { totalWeight: 0, tripCount: 0, weights: [] };
      }
      const tons = r.netWeightKg / 1000;
      dailyStats[dateKey].totalWeight += tons;
      dailyStats[dateKey].tripCount += 1;
      dailyStats[dateKey].weights.push(tons);
  });

  const days = Object.values(dailyStats);
  const totalDays = days.length;
  if (totalDays === 0) throw new Error("No data available");

  // --- Lucky Day Logic Calculation ---
  let luckySum = 0; let luckyCount = 0;
  let unluckySum = 0; let unluckyCount = 0;
  let normalSum = 0; let normalCount = 0;

  // Helper to extract d/m from date string "17/2/2569" -> "17/2"
  const getDayMonth = (dateStr: string) => {
      const parts = dateStr.split('/');
      if (parts.length >= 2) return `${parseInt(parts[0])}/${parseInt(parts[1])}`;
      return "";
  };

  Object.entries(dailyStats).forEach(([dateStr, stat]) => {
      const dm = getDayMonth(dateStr);
      const event = luckyEvents.find(e => e.dateStr === dm);

      if (event) {
          if (event.type === 'good') {
              luckySum += stat.totalWeight;
              luckyCount++;
          } else if (event.type === 'bad') {
              unluckySum += stat.totalWeight;
              unluckyCount++;
          }
      } else {
          normalSum += stat.totalWeight;
          normalCount++;
      }
  });

  const avgLucky = luckyCount > 0 ? luckySum / luckyCount : 0;
  const avgUnlucky = unluckyCount > 0 ? unluckySum / unluckyCount : 0;
  const avgNormal = normalCount > 0 ? normalSum / normalCount : 0;
  // -----------------------------------

  // Trip Stats
  let singleTripDays = 0;
  let doubleTripDays = 0;
  let rawWeightsPerTrip: number[] = [];

  days.forEach(d => {
      if (d.tripCount === 1) singleTripDays++;
      else if (d.tripCount >= 2) doubleTripDays++;
      rawWeightsPerTrip.push(...d.weights);
  });
  const simpleAvgPerTrip = rawWeightsPerTrip.reduce((a, b) => a + b, 0) / rawWeightsPerTrip.length;


  const promptText = `
  Role: Sugar Cane Logistic Analyst (incorporating User's Beliefs/Superstition).
  Task: Analyze delivery potential based on Trip Behavior AND "Lucky Day" correlations.

  Input Data:
  - Total Working Days: ${totalDays}
  - Trip Behavior: 1 Trip (${singleTripDays} days), 2 Trips (${doubleTripDays} days).
  - Avg Weight/Trip: ${simpleAvgPerTrip.toFixed(2)} Tons.

  User's "Lucky Day" Performance (Superstition Check):
  - Average on 'Lucky/Good' Days: ${avgLucky.toFixed(2)} Tons (Count: ${luckyCount})
  - Average on 'Unlucky/Bad' Days: ${avgUnlucky.toFixed(2)} Tons (Count: ${unluckyCount})
  - Average on Normal Days: ${avgNormal.toFixed(2)} Tons
  
  Analysis Steps:
  1. Trip Analysis: Find the "Stable Weight Per Trip" and likelihood of 2 trips.
  2. Lucky Day Correlation: Does the data support the user's belief? 
     - If avgLucky > avgUnlucky significantly, acknowledge the correlation.
     - If not, suggest it might be psychological but still use positive reinforcement.
  3. Calculate "Sustainable Daily Rate":
     - Base it on the Trip Analysis mainly.
     - But if Lucky Day correlation is strong, slight adjust the rate to reflect "Confidence".

  Output JSON (Thai Language):
  {
    "sustainableDailyRate": number,
    "stableWeightPerTrip": number,
    "tripBehavior": "string (Trip analysis)",
    "luckyDayCorrelation": "string (Analyze if Lucky Days actually performed better than Unlucky days based on the provided numbers)",
    "avgLuckyDay": number (The avgLucky input),
    "avgUnluckyDay": number (The avgUnlucky input),
    "reasoning": "string (Explain calculation)"
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text: promptText }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sustainableDailyRate: { type: Type.NUMBER },
            stableWeightPerTrip: { type: Type.NUMBER },
            tripBehavior: { type: Type.STRING },
            luckyDayCorrelation: { type: Type.STRING },
            avgLuckyDay: { type: Type.NUMBER },
            avgUnluckyDay: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
          },
          required: ["sustainableDailyRate", "stableWeightPerTrip", "tripBehavior", "reasoning", "luckyDayCorrelation"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response from AI Analysis");

  } catch (error) {
    console.error("AI Analysis Failed:", error);
    // Fallback
    return {
      sustainableDailyRate: days.reduce((sum, d) => sum + d.totalWeight, 0) / totalDays,
      stableWeightPerTrip: simpleAvgPerTrip,
      tripBehavior: "ระบบ AI ไม่พร้อมใช้งาน",
      luckyDayCorrelation: "ไม่สามารถวิเคราะห์ได้",
      avgLuckyDay: avgLucky,
      avgUnluckyDay: avgUnlucky,
      reasoning: "ใช้ค่าเฉลี่ยทางคณิตศาสตร์เนื่องจาก AI ขัดข้อง"
    };
  }
};