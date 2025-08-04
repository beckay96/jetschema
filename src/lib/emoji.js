/**
 * Simple emoji utility library for JetSchema
 * Provides functionality to map keywords to related emojis
 */

// Map of keywords to emoji characters
const emojiMap = {
  // Database related
  'database': '🗄️',
  'table': '📋',
  'schema': '📐',
  'field': '📊',
  'column': '📊',
  'row': '📝',
  'query': '🔍',
  'sql': '💾',
  'api': '🔌',
  
  // Status/priority related
  'todo': '📌',
  'done': '✅',
  'pending': '⏳',
  'important': '❗',
  'urgent': '🚨',
  'high': '🔴',
  'medium': '🟠',
  'low': '🟢',
  'bug': '🐛',
  'fix': '🔧',
  'warning': '⚠️',
  
  // Sentiments/reactions
  'like': '👍',
  'dislike': '👎',
  'love': '❤️',
  'idea': '💡',
  'question': '❓',
  'star': '⭐',
  'fire': '🔥',
  'rocket': '🚀',
  'eyes': '👀',
  'smile': '😊',
  'sad': '😢',
  'laugh': '😂',
  'thumbsup': '👍',
  'note': '📝',
  'ok': '✅',
  
  // Tech related
  'code': '💻',
  'frontend': '🖥️',
  'backend': '⚙️',
  'mobile': '📱',
  'web': '🌐',
  'cloud': '☁️',
  'security': '🔒',
  'test': '🧪',
  'deploy': '🚀',
  
  // Common actions
  'add': '➕',
  'remove': '➖',
  'edit': '✏️',
  'delete': '🗑️',
  'search': '🔍',
  'save': '💾',
  'share': '📤',
  'link': '🔗',
  'comment': '💬',
  'task': '📋'
};

/**
 * Get an emoji for a given keyword
 * @param {string} keyword - The keyword to find an emoji for
 * @param {string} defaultEmoji - Fallback emoji if keyword isn't found
 * @returns {string} The matching emoji or default emoji
 */
export function getEmojiForKeyword(keyword, defaultEmoji = '📌') {
  if (!keyword) return defaultEmoji;
  
  const normalizedKeyword = keyword.toLowerCase().trim();
  return emojiMap[normalizedKeyword] || defaultEmoji;
}

/**
 * Check if a keyword has an associated emoji
 * @param {string} keyword - The keyword to check
 * @returns {boolean} True if the keyword has an associated emoji
 */
export function hasEmoji(keyword) {
  if (!keyword) return false;
  const normalizedKeyword = keyword.toLowerCase().trim();
  return normalizedKeyword in emojiMap;
}

/**
 * Get all available emoji keywords
 * @returns {string[]} Array of available keywords
 */
export function getAvailableEmojiKeywords() {
  return Object.keys(emojiMap);
}

/**
 * Get emoji for hashtag
 * @param {string} hashtag - The hashtag to find an emoji for (with or without #)
 * @returns {string} The matching emoji or null if not found
 */
export function getEmojiForHashtag(hashtag) {
  if (!hashtag) return null;
  
  // Remove # if present
  const keyword = hashtag.startsWith('#') ? hashtag.substring(1) : hashtag;
  const normalizedKeyword = keyword.toLowerCase().trim();
  
  return emojiMap[normalizedKeyword] || null;
}
