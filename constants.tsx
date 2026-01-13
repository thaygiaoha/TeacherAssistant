
import { ViolationRule, RewardRule, BCHRule } from './types';

// Fix: Renamed properties 'name' to 'nameRule' and 'code' to 'codeRule' to match ViolationRule interface
export const INITIAL_VIOLATIONS: ViolationRule[] = [
  { nameRule: 'Đi muộn', codeRule: 'M1', points: 2 },
  { nameRule: 'Nghỉ học không phép', codeRule: 'M2', points: 5 },
  { nameRule: 'Không đeo khăn quàng', codeRule: 'M3', points: 1 },
  { nameRule: 'Gây mất trật tự', codeRule: 'M4', points: 3 },
  { nameRule: 'Sử dụng điện thoại trong giờ', codeRule: 'M5', points: 5 },
];

// Fix: Renamed properties 'name' to 'nameBonus' and 'code' to 'codeBonus' to match RewardRule interface
export const INITIAL_REWARDS: RewardRule[] = [
  { nameBonus: 'Phát biểu xây dựng bài', codeBonus: 'T1', points: 2 },
  { nameBonus: 'Điểm 10', codeBonus: 'T2', points: 5 },
  { nameBonus: 'Tham gia phong trào', codeBonus: 'T3', points: 5 },
  { nameBonus: 'Giúp đỡ bạn bè', codeBonus: 'T4', points: 3 },
];

// Fix: Renamed properties 'title' to 'nameTitle' and 'code' to 'codeTitle' to match BCHRule interface
export const INITIAL_BCH: BCHRule[] = [
  { nameTitle: 'Lớp trưởng', codeTitle: 'LT', points: 10 },
  { nameTitle: 'Lớp phó', codeTitle: 'LP', points: 8 },
  { nameTitle: 'Tổ trưởng', codeTitle: 'TT', points: 5 },
];

export const YEAR_RANKING_RULES: Record<string, string> = {
  'T-T': 'Tốt',
  'T-K': 'Khá',
  'K-K': 'Khá',
  'K-T': 'Khá',
  'K-Đ': 'Đạt',
  'Đ-K': 'Đạt',
  'Đ-Đ': 'Đạt',
  'Đ-T': 'Khá',
  'T-Đ': 'Khá',
};
