/**
 * Simple emoji keyword mapping utility for stickers
 */

// Map of keywords to emoji characters
const emojiMap = {
  // Common keywords
  star: '⭐',
  fire: '🔥',
  idea: '💡',
  check: '✅',
  warning: '⚠️',
  error: '❌',
  bug: '🐛',
  todo: '📝',
  note: '📌',
  important: '❗',
  question: '❓',
  info: '📊',
  time: '⏰',
  lock: '🔒',
  key: '🔑',
  pin: '📍',
  flag: '🚩',
  
  // Database related
  database: '🗄️',
  table: '📋',
  column: '📊',
  sql: '📜',
  query: '🔍',
  
  // Status related
  done: '✅',
  pending: '⏳',
  blocked: '🛑',
  inprogress: '🚧',
  
  // Other useful symbols
  heart: '❤️',
  thumbsup: '👍',
  thumbsdown: '👎',
  eyes: '👀',
  speech: '💬',
  smile: '😊',
  sad: '😢',
  think: '🤔',
  rocket: '🚀',
  sparkles: '✨',
};

/**
 * Get emoji for a given keyword
 * @param keyword - The keyword to look up
 * @returns The emoji character or undefined if not found
 */
export const getEmojiForKeyword = (keyword) => {
  if (!keyword) return undefined;
  
  const lowercaseKeyword = keyword.toLowerCase().trim();
  return emojiMap[lowercaseKeyword];
};

/**
 * Get all available emoji keywords
 * @returns Array of available emoji keywords
 */
export const getAvailableEmojiKeywords = () => {
  return Object.keys(emojiMap);
};
