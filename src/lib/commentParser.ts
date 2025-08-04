/**
 * Utilities for parsing and formatting comment content with @mentions and #hashtags
 */

// Regex patterns for parsing
const MENTION_PATTERN = /@(\w+)/g;
const HASHTAG_PATTERN = /#(\w+)/g;

// Definition for parsed comment parts
// type can be 'text', 'mention', or 'hashtag'
// content is the text content of the part

/**
 * Parse comment text to extract @mentions and #hashtags
 */
export function parseComment(text) {
  if (!text) return [];
  
  // Split the text into parts while preserving mentions and hashtags
  const parts = [];
  let lastIndex = 0;
  
  // Combined regex to find either mentions or hashtags
  const combinedPattern = /(@\w+|#\w+)/g;
  let match;
  
  while ((match = combinedPattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }
    
    // Determine if it's a mention or hashtag and add it
    const matchText = match[0];
    if (matchText.startsWith('@')) {
      parts.push({
        type: 'mention',
        content: matchText.substring(1) // Remove @ symbol
      });
    } else if (matchText.startsWith('#')) {
      parts.push({
        type: 'hashtag',
        content: matchText.substring(1) // Remove # symbol
      });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }
  
  return parts;
}

/**
 * Extract @mentions from comment text
 */
export function extractMentions(text) {
  if (!text) return [];
  
  const mentions = [];
  let match;
  
  while ((match = MENTION_PATTERN.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
}

/**
 * Extract #hashtags from comment text
 */
export function extractHashtags(text) {
  if (!text) return [];
  
  const hashtags = [];
  let match;
  
  while ((match = HASHTAG_PATTERN.exec(text)) !== null) {
    hashtags.push(match[1]);
  }
  
  return hashtags;
}

/**
 * Check if comment text contains any @mentions or #hashtags
 */
export function hasSpecialSyntax(text) {
  if (!text) return false;
  return MENTION_PATTERN.test(text) || HASHTAG_PATTERN.test(text);
}
