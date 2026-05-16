/**
 * Unified LLM + Pipeline module
 *
 * Staged execution model:
 * Preparation → Extraction → Retrieval → Generation → Post-processing → Validation → Delivery
 *
 * Convention: app/UI/routes should import from stage entrypoints (or this top-level barrel)
 * to minimize merge conflicts and keep a single source of truth per stage.
 */

export * from './preparation';
export * from './extraction';
export * from './retrieval';
export * from './generation';
export * from './post-processing';
export * from './validation';
export * from './delivery';
