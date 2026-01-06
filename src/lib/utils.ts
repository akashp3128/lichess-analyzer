import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatPercentage(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}

export function getResultColor(result: string): string {
  switch (result) {
    case 'win':
      return 'text-green-600';
    case 'loss':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

export function getClassificationColor(classification: string): string {
  switch (classification) {
    case 'best':
      return 'bg-green-500';
    case 'good':
      return 'bg-green-400';
    case 'inaccuracy':
      return 'bg-yellow-400';
    case 'mistake':
      return 'bg-orange-500';
    case 'blunder':
    case 'missed_mate':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
