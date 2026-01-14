
export type Gender = 'Nam' | 'Nữ';
// danh sach
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
  image: string;
}
// người thân
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
// bảng lỗi
export interface ViolationRule {
  nameRule: string;
  codeRule: string;
  points: number;
}
// thành tích
export interface RewardRule {
  nameBonus: string;
  codeBonus: string;
  points: number;
}
// ban chấp hành
export interface BCHRule {
  nameTitle: string;
  codeTitle: string;
  points: number;
}
// tuần
export interface WeeklyScore {
  idhs: string;
  name: string;
  weeks: { [key: string]: number };
}
// vi phậm
export interface ViolationLog {
  idhs: string;
  name: string;
  v_logs: { [key: string]: string[] };
}
// thưởng
export interface RewardLog {
  idhs: string;
  name: string;
  t_logs: { [key: string]: string[] };
}

export interface AppState {
  students: Student[];
  relatives: RelativeInfo[];
  violations: ViolationRule[];
  rewards: RewardRule[];
  bch: BCHRule[];
  weeklyScores: WeeklyScore[];
  violationLogs: ViolationLog[];
  rewardLogs: RewardLog[];
  currentWeek: number;
  googleScriptUrl: string;
  appPassword?: string; // Lấy từ ô F2 sheet xeploaihk
}
