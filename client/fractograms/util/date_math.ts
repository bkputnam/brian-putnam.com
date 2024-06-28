const DAILY_START = new Date(2024, 5, 27);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function daysSinceDailyStart(date: Date): number {
    return Math.floor((date.getTime() - DAILY_START.getTime()) / MS_PER_DAY);
}
