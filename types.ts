export interface CaneTicket {
  id: string;
  ticketNumber: string;
  date: string;
  time: string;
  netWeightKg: number;
  grossWeightKg?: number;
  tareWeightKg?: number;
  licensePlate: string;
  vendorName: string;
  productName: string;
  imageUrl?: string;
  timestamp: number;
}

export interface GoalHistory {
  round: number;
  targetTons: number;
  achievedTons: number;
  completedDate: string;
  timestamp: number;
}

export interface QuotaSettings {
  targetTons: number;
  currentGoalStartDate: number;
  history: GoalHistory[];
  googleScriptUrl?: string; // New field for Google Apps Script URL
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SCANNER = 'SCANNER',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS'
}