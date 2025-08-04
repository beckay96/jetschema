/**
 * Type definitions for emoji utility library
 */

/**
 * Get an emoji for a given keyword
 * @param keyword - The keyword to find an emoji for
 * @param defaultEmoji - Fallback emoji if keyword isn't found
 * @returns The matching emoji or default emoji
 */
export function getEmojiForKeyword(keyword: string, defaultEmoji?: string): string;

/**
 * Check if a keyword has an associated emoji
 * @param keyword - The keyword to check
 * @returns True if the keyword has an associated emoji
 */
export function hasEmoji(keyword: string): boolean;

/**
 * Get all available emoji keywords
 * @returns Array of available keywords
 */
export function getAvailableKeywords(): string[];

/**
 * Get the full emoji map
 * @returns An object with keywords as keys and emoji characters as values
 */
export function getAllEmojis(): Record<string, string>;
