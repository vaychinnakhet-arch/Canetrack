import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  const apiKey = "AIzaSyCyckP_GULyrrtzB7WWpla4yKdLxFJVliQ";
  if (!apiKey) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeTicketImage = async (base64Image: string): Promise<any> => {
  const ai = getAiClient();
  
  // Clean base64 string if it has prefix
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
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