# Depth Batching Strategy

The Webflow `element_builder` can create elements max 3 levels deep per call.
Designs are often 5–10+ levels deep. This doc explains how to handle that.

## Algorithm

1. Walk the design tree. Assign depth to each node (root = 0).
2. Slice at every 3rd level.
3. Batch 1: create levels 0–2, page body as parent.
4. Batch 2+: use element IDs returned from previous batch as `parent_element_id`.
5. Leaf text nodes (Heading, Paragraph, TextBlock) never have children, so they always fit.

## Example: 5-Level Navigation

```
Section (depth 0)              ─┐
  nav-wrapper (depth 1)         │  Batch 1
    nav-left (depth 2)          │  (one element_builder call)
    nav-right (depth 2)        ─┘
      logo (depth 3)           ─┐
      brand-text (depth 3)      │  Batch 2
      link-1 (depth 3)          │  (parent = nav-left or nav-right ID)
      link-2 (depth 3)          │
      cta-button (depth 3)     ─┘
        button-text (depth 4)  ─── Batch 3 (parent = cta-button ID)
```

**Batch 1**: one call creating Section > nav-wrapper > [nav-left, nav-right]

**Batch 2**: two calls:
- parent = nav-left's ID → create logo + brand-text
- parent = nav-right's ID → create link-1 + link-2 + cta-button

**Batch 3**: one call:
- parent = cta-button's ID → create button-text

## Key Details

- `element_builder` returns created element IDs in its response
- Match returned IDs to design nodes so you know where to attach the next batch
- When a level-2 node has only leaf children (text, images), those fit in batch 1 — no need to split
- Process batches top-down, left-to-right to maintain visual order
- Styles should already exist (created in Step 2 of the workflow) before any element_builder calls

## Optimization

For shallow designs (3 levels or less), a single `element_builder` call handles everything.
Only split when the tree genuinely exceeds 3 container levels deep.
