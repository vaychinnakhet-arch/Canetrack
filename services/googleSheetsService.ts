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
    // Note: We use 'no-cors' implicitly via simple request or just fire-and-forget logic 
    // because GAS often returns opaque responses for POST.
    // We assume if fetch doesn't throw, it worked.
    await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', 
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
    // Append timestamp to avoid browser caching
    const separator = scriptUrl.includes('?') ? '&' : '?';
    const url = `${scriptUrl}${separator}t=${Date.now()}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
        console.error("Data received is not an array:", data);
        return [];
    }

    // Map the raw data from Google Sheets back to CaneTicket objects
    return data.map((item: any, index: number) => ({
      id: `sheet-${index}-${item.timestamp}`, // Create a unique ID
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
    return null; // Return null to indicate error
  }
};