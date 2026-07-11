import { lazy, ComponentType } from 'react';

const CHUNK_RETRY_PREFIX = 'chunk-load-retry:';

function isChunkLoadError(error: unknown): boolean {
  const message = String(
    error instanceof Error ? error.message : error ?? ''
  );
  const name = error instanceof Error ? error.name : '';
  return (
    name === 'ChunkLoadError' ||
    /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i.test(
      message
    )
  );
}

function retryKeyFor(factory: () => Promise<unknown>): string {
  return `${CHUNK_RETRY_PREFIX}${factory.toString()}`;
}

/**
 * React.lazy wrapper that reloads once on stale webpack chunk failures (CRA HMR / deploy mismatch).
 * Retry state is per-factory so a successful sibling chunk cannot clear another route's guard.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const storageKey = retryKeyFor(factory);
  return lazy(() =>
    factory()
      .then((module) => {
        sessionStorage.removeItem(storageKey);
        return module;
      })
      .catch((error: unknown) => {
        if (isChunkLoadError(error) && !sessionStorage.getItem(storageKey)) {
          sessionStorage.setItem(storageKey, '1');
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
        sessionStorage.removeItem(storageKey);
        throw error;
      })
  );
}
