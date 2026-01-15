
export type Gender = 'Nam' | 'Nữ';

export interface Student {
  stt: number;
  name: string;
  class: string;
  date: string;
  gender: Gender;
  phoneNumber: string;
  accommodation: string;
  cccd: string;
  idhs: string;
  avatarUrl?: string;
}

// Added missing ViolationRule interface
export interface ViolationRule {
  nameRule: string;
  codeRule: string;
  points: number;
}

// Added missing RewardRule interface
export interface RewardRule {
  nameBonus: string;
  codeBonus: string;
  points: number;
}

// Added missing BCHRule interface
export interface BCHRule {
  nameTitle: string;
  codeTitle: string;
  points: number;
}

// Added missing RelativeInfo interface
export interface RelativeInfo {
  idhs: string;
  namefather: string;
  phonefather: string;
  datefather: string;
  jobfather: string;
  namemother: string;
  phonemother: string;
  datemother: string;
  jobmother: string;
  hoancanh: string;
}

export interface GradingThresholds {
  tot: number;
  kha: number;
  dat: number;
  chuaDat: number;
}

export interface ManualRank {
  idhs: string;
  rank: string;
}

export interface AppState {
  gvcnName: string;
  students: Student[];
  relatives: any[];
  violations: any[];
  rewards: any[];
  bchRules: any[]; // <--- THÊM DÒNG NÀY VÀO TRONG AppState
  bchNames: any[];
  newsData: { title: string; link: string }[];
  newsList: { news: string; link: string }[];
  violationLogs: any[];
  rewardLogs: any[];
  currentWeek: number;
  googleScriptUrl: string;
  appPassword?: string;
  gradingThresholds: GradingThresholds;
  manualRanks: ManualRank[];
}
