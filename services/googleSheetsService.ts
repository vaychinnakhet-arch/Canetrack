import { CaneTicket } from '../types';

export const syncToGoogleSheets = async (scriptUrl: string, ticket: CaneTicket): Promise<boolean> => {
  if (!scriptUrl) return false;

  const cleanBase64 = ticket.imageUrl 
    ? ticket.imageUrl.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "") 
    : "";

  const payload = {
    ticketNumber: ticket.ticketNumber,
    date: ticket.date,
    time: ticket.time,
    netWeightKg: ticket.netWeightKg,
    grossWeightKg: ticket.grossWeightKg || 0,
    tareWeightKg: ticket.tareWeightKg || 0,
    licensePlate: ticket.licensePlate,
    vendorName: ticket.vendorName,
    productName: ticket.productName,
    imageBase64: cleanBase64
  };

  try {
    // Use 'no-cors' to ensure the request is sent even if the browser blocks the redirect response.
    // Content-Type must be text/plain to satisfy 'no-cors' constraints or simple request checks.
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain', 
      },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (error) {
    console.error("Error syncing to Google Sheets:", error);
    return false;
  }
};

export const fetchFromGoogleSheets = async (scriptUrl: string): Promise<CaneTicket[] | null> => {
  if (!scriptUrl) return null;

  try {
    // Append timestamp to prevent caching
    const separator = scriptUrl.includes('?') ? '&' : '?';
    const url = `${scriptUrl}${separator}t=${Date.now()}`;

    // Simplified GET request. 
    // We removed 'credentials: omit' and explicit redirect options to rely on standard browser defaults,
    // which is often the most compatible way to handle GAS Web App redirects for public scripts.
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
        console.error("Data received is not an array:", data);
        return [];
    }

    // Map data
    return data.map((item: any, index: number) => ({
      id: `sheet-${index}-${item.timestamp}`,
      ticketNumber: item.ticketNumber,
      date: item.date,
      time: item.time,
      netWeightKg: Number(item.netWeightKg) || 0,
      grossWeightKg: Number(item.grossWeightKg) || 0,
      tareWeightKg: Number(item.tareWeightKg) || 0,
      licensePlate: item.licensePlate,
      vendorName: item.vendorName,
      productName: item.productName,
      imageUrl: item.imageUrl,
      timestamp: item.timestamp || Date.now()
    }));
  } catch (error) {
    console.error("Error fetching from Google Sheets:", error);
    return null;
  }
};