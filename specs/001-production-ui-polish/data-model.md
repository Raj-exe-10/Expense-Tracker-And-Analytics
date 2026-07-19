# Data Model: Production UI Polish + Animations

**Status**: N/A — this feature is presentation-layer only.

No new data entities, fields, or state transitions are introduced. All pages continue to read from the existing Redux slices (`frontend/src/store/slices/`) and existing `*API` modules (`frontend/src/services/api.ts`) exactly as before; this initiative only changes how the *same* data is rendered (loading/empty/error/animated states), not what data is fetched or stored.

For reference, the "shapes" this feature adds are UI-only component props, not persisted entities:

- **LcLoadingState props**: `label?: string`, `fullHeight?: boolean`
- **LcEmptyState props**: `title: string`, `description?: string`, `action?: ReactNode`, `icon?: ReactNode`
- **LcErrorState props**: `message: string`, `onRetry?: () => void`
- **PageTransition props**: `children: ReactNode` (wraps page content; no external config needed per FR-008's "consistent, shared pattern" requirement)
