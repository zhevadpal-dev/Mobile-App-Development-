/**
 * Seasonal logic based on current device month (Northern Hemisphere):
 * - Spring (March, April, May): 🌸
 * - Summer (June, July, August): ☀️
 * - Autumn (September, October, November): 🍁
 * - Winter (December, January, February): ❄️
 */
export const getSeasonalEmoji = (date: Date = new Date()): string => {
  const month = date.getMonth(); // 0 = Jan, 1 = Feb, ..., 11 = Dec

  // Spring: March (2), April (3), May (4)
  if (month >= 2 && month <= 4) {
    return '🌸';
  }

  // Summer: June (5), July (6), August (7)
  if (month >= 5 && month <= 7) {
    return '☀️';
  }

  // Autumn: September (8), October (9), November (10)
  if (month >= 8 && month <= 10) {
    return '🍁';
  }

  // Winter: December (11), January (0), February (1)
  return '❄️';
};

/**
 * Return current season name
 */
export const getSeasonName = (date: Date = new Date()): string => {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Autumn';
  return 'Winter';
};
