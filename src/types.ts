export type ApplianceType = 
  | 'refrigerator'
  | 'washing_machine'
  | 'dryer'
  | 'dishwasher'
  | 'laptop'
  | 'microwave'
  | 'hvac_ac'
  | 'oven_range'
  | 'water_heater'
  | 'television';

export type RecommendationType = 'REPAIR' | 'REPLACE' | 'CONSULT_PRO';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'technician' | 'admin';
  createdAt: string;
}

export interface UserFile {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath: string;
  storageProvider?: 'local' | 'supabase';
  storagePath?: string;
  publicUrl?: string;
  category: 'damage_photo' | 'error_code' | 'invoice_receipt' | 'model_plate' | 'other';
  relatedSessionId?: string;
  uploadedAt: string;
}

export interface DiagnosticSession {
  id: string;
  userId: string;
  applianceType: ApplianceType;
  brand: string;
  modelNumber?: string;
  ageYears: number;
  expectedLifespanYears: number;
  originalPrice: number;
  estimatedRepairCost: number;
  replacementCost: number;
  problemTitle: string;
  symptoms: string[];
  severity: 'low' | 'moderate' | 'critical';
  recommendation: RecommendationType;
  recommendationReason: string;
  estimatedSavings: number;
  carbonSavingsKg: number;
  fiftyPercentRuleTriggered: boolean;
  diyChecklist: string[];
  attachedFileIds: string[];
  status: 'active' | 'resolved' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface RepairEstimate {
  id: string;
  userId: string;
  diagnosticSessionId?: string;
  applianceDescription: string;
  serviceCenterName: string;
  serviceCenterPhone?: string;
  partsCost: number;
  laborCost: number;
  taxAndFees: number;
  totalCost: number;
  warrantyMonths: number;
  validUntil: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  attachedFileIds: string[];
  createdAt: string;
}

export interface CenterReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  applianceType?: ApplianceType;
  verifiedRepair: boolean;
}

export interface ServiceCenter {
  id: string;
  name: string;
  centerType: 'repair_service' | 'appliance_store';
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  rating: number;
  reviewCount: number;
  specialties: ApplianceType[];
  certifiedBrands: string[];
  hourlyRateEstimate: number;
  hasMobileDispatch: boolean;
  isOpen: boolean;
  operatingHours: {
    weekday: string;
    saturday: string;
    sunday: string;
  };
  reviews: CenterReview[];
  storeOfferings?: string[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'estimate_ready' | 'status_update' | 'recall_alert' | 'followup' | 'system';
  read: boolean;
  linkTab?: string;
  createdAt: string;
}

export interface DecisionCalculation {
  recommendation: RecommendationType;
  primaryReason: string;
  savings: number;
  isRepairCheaper: boolean;
  fiftyPercentRuleBreached: boolean;
  ageRatio: number;
  costRatio: number;
  currentEstimatedValue: number;
  carbonSavingsKg: number;
  confidenceScore: number;
  diyChecklist: string[];
  repairedExpectedLifespanYears?: number;
  newExpectedLifespanYears?: number;
  annualizedRepairCost?: number;
  annualizedReplacementCost?: number;
}

export interface DiagnosedIssueOption {
  id: string;
  applianceType: ApplianceType;
  title: string;
  component: string;
  description: string;
  severity: 'low' | 'moderate' | 'critical';
  estimatedRepairCost: number;
  partsCostEstimate: number;
  laborCostEstimate: number;
  repairedAddedLifespanYears: number;
  typicalReplacementCost: number;
  newUnitLifespanYears: number;
  recommendationDefault: RecommendationType;
  rationaleTemplate: string;
  diyFeasibility: 'Professional Required' | 'Advanced DIY' | 'Simple DIY';
}
