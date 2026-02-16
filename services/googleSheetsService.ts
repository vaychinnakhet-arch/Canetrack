import { CaneTicket } from '../types';

export const syncToGoogleSheets = async (scriptUrl: string, ticket: CaneTicket): Promise<boolean> => {
  if (!scriptUrl) return false;

  // Prepare payload
  // We strip the data:image prefix for the Google Script to decode easily
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
    // When sending data to Google Apps Script Web App from the browser,
    // sending a POST request often results in a 302 Redirect which browsers follow.
    // However, the final response often lacks CORS headers in simple configurations.
    // We use 'text/plain' to avoid preflight OPTIONS requests.
    // We assume if the fetch resolves (doesn't throw network error), the data was sent.
    
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