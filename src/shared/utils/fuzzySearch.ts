/**
 * Fuzzy Search Utility
 * 
 * Provides fuzzy matching and search functionality for tickets.
 * Supports scoring and ranking of search results.
 */

/**
 * Calculate fuzzy match score between query and text
 * Returns 0 for no match, higher scores for better matches
 */
export function fuzzyMatchScore(query: string, text: string): number {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Exact match - highest score
  if (textLower === queryLower) {
    return 1000;
  }

  // Starts with - high score
  if (textLower.startsWith(queryLower)) {
    return 800;
  }

  // Contains - medium score
  if (textLower.includes(queryLower)) {
    return 500;
  }

  // Fuzzy match - calculate score based on character matches
  let score = 0;
  let queryIndex = 0;

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score += 10;
      queryIndex++;
    }
  }

  // Only count as match if all query characters found
  return queryIndex === queryLower.length ? score : 0;
}

/**
 * Fuzzy search with scoring and ranking
 * 
 * @param items - Array of items to search through
 * @param query - Search query string
 * @param keyExtractors - Array of functions to extract searchable strings from items
 * @returns Filtered and sorted array of matching items
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  keyExtractors: ((item: T) => string)[]
): T[] {
  if (!query) {
    return items;
  }

  const scoredItems = items.map((item) => {
    let maxScore = 0;

    for (const extractor of keyExtractors) {
      const text = extractor(item);
      const score = fuzzyMatchScore(query, text);
      maxScore = Math.max(maxScore, score);
    }

    return { item, score: maxScore };
  });

  return scoredItems
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

