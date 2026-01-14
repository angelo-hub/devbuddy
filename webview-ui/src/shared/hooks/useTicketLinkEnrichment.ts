/**
 * Hook for enriching ticket links with live metadata
 * 
 * Fetches ticket metadata (title, status) for ticket links referenced in text,
 * allowing markdown/ADF renderers to display enriched information instead of
 * static/stale titles from URL slugs.
 */

import { useState, useCallback } from "react";
import { postMessage } from "@shared/stores";
import type { EnrichedTicketMetadata } from "@shared/types/messages";

interface UseTicketLinkEnrichmentOptions {
  /** Maximum number of tickets to enrich per request (avoid overwhelming API) */
  maxTickets?: number;
  /** Cache duration in milliseconds (default: 5 minutes) */
  cacheDuration?: number;
}

interface TicketMetadataCache {
  [ticketId: string]: {
    metadata: EnrichedTicketMetadata;
    timestamp: number;
  };
}

/**
 * Hook for enriching ticket links with live metadata
 * 
 * Usage:
 * ```tsx
 * const { enrichedMetadata, enrichTicketIds } = useTicketLinkEnrichment();
 * 
 * useEffect(() => {
 *   const ticketIds = extractTicketIdsFromText(description);
 *   enrichTicketIds(ticketIds);
 * }, [description]);
 * 
 * // Pass enrichedMetadata to markdown renderer
 * renderMarkdown(description, { enrichedMetadata });
 * ```
 */
export function useTicketLinkEnrichment(options: UseTicketLinkEnrichmentOptions = {}) {
  const {
    maxTickets = 20,
    cacheDuration = 5 * 60 * 1000, // 5 minutes
  } = options;

  const [enrichedMetadata, setEnrichedMetadata] = useState<Map<string, EnrichedTicketMetadata>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);

  // Local cache to avoid repeated API calls
  const [cache] = useState<TicketMetadataCache>({});

  /**
   * Extract ticket IDs from enriched metadata and cache them
   */
  const updateCache = useCallback((metadata: EnrichedTicketMetadata[]) => {
    const now = Date.now();
    metadata.forEach((ticket) => {
      cache[ticket.identifier] = {
        metadata: ticket,
        timestamp: now,
      };
    });

    // Update state with fresh metadata
    setEnrichedMetadata((prev) => {
      const next = new Map(prev);
      metadata.forEach((ticket) => {
        next.set(ticket.identifier, ticket);
      });
      return next;
    });
  }, [cache]);

  /**
   * Check if cached data is still valid
   */
  const isCacheValid = useCallback((ticketId: string): boolean => {
    const cached = cache[ticketId];
    if (!cached) return false;
    
    const age = Date.now() - cached.timestamp;
    return age < cacheDuration;
  }, [cache, cacheDuration]);

  /**
   * Enrich ticket IDs with metadata
   */
  const enrichTicketIds = useCallback(async (ticketIds: string[]) => {
    if (ticketIds.length === 0) return;

    // Filter out already-cached tickets
    const uncachedIds = ticketIds.filter((id) => !isCacheValid(id));
    
    if (uncachedIds.length === 0) {
      // All tickets are cached, just update state with cached data
      const cachedMetadata = ticketIds
        .filter((id) => cache[id])
        .map((id) => cache[id].metadata);
      
      setEnrichedMetadata((prev) => {
        const next = new Map(prev);
        cachedMetadata.forEach((ticket) => {
          next.set(ticket.identifier, ticket);
        });
        return next;
      });
      return;
    }

    // Limit to maxTickets to avoid overwhelming the API
    const idsToFetch = uncachedIds.slice(0, maxTickets);

    setLoading(true);

    // Request metadata from extension
    postMessage({
      command: "enrichTicketLinks",
      ticketIds: idsToFetch,
    });

    // Note: Response will be handled by message listener in parent component
    // The parent should call updateCache() when metadata arrives
  }, [isCacheValid, maxTickets, cache]);

  /**
   * Clear the cache (useful for forcing refresh)
   */
  const clearCache = useCallback(() => {
    Object.keys(cache).forEach((key) => delete cache[key]);
    setEnrichedMetadata(new Map());
  }, [cache]);

  return {
    enrichedMetadata,
    enrichTicketIds,
    updateCache,
    clearCache,
    loading,
  };
}

/**
 * Extract ticket IDs from text (supports both Linear and Jira patterns)
 * 
 * Matches:
 * - Linear: ENG-123, ABC-456 (2+ uppercase letters, hyphen, digits)
 * - Jira: PROJ-123, TICKET-456 (same pattern)
 * - URLs with ticket identifiers
 */
export function extractTicketIdsFromText(text: string): string[] {
  if (!text) return [];

  const ticketIds = new Set<string>();

  // Pattern 1: Direct ticket IDs (e.g., ENG-123, PROJ-456)
  const directPattern = /\b([A-Z]{2,}-\d+)\b/g;
  let match;
  while ((match = directPattern.exec(text)) !== null) {
    ticketIds.add(match[1].toUpperCase());
  }

  // Pattern 2: Linear issue URLs
  const linearPattern = /https?:\/\/linear\.app\/[^/]+\/issue\/([A-Z]+-\d+)/gi;
  while ((match = linearPattern.exec(text)) !== null) {
    ticketIds.add(match[1].toUpperCase());
  }

  // Pattern 3: Jira issue URLs (Cloud and Server)
  const jiraPattern = /https?:\/\/[^/]+\/browse\/([A-Z]+-\d+)/gi;
  while ((match = jiraPattern.exec(text)) !== null) {
    ticketIds.add(match[1].toUpperCase());
  }

  return Array.from(ticketIds);
}

