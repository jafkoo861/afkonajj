
import { Player } from '../types';

export const calculateMarketValue = (player: Player): number => {
  const base = player.ovr * player.ovr * 500;
  const ageMultiplier = player.age < 23 ? 1.5 : player.age > 30 ? 0.6 : 1.0;
  const potentialMultiplier = (player.potential - player.ovr) * 0.1 + 1.0;
  return Math.round(base * ageMultiplier * potentialMultiplier);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const advanceDate = (currentDate: string): string => {
  const d = new Date(currentDate);
  d.setDate(d.getDate() + 1);
  return d.toISOString();
};
