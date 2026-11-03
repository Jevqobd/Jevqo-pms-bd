## 2024-05-24 - O(N) Iteration Consolidation in Dashboard
**Learning:** Found a common React anti-pattern where a single data array (`orders`) was being iterated over 7 times per render using multiple `.filter()` and `.reduce()` calls to compute dashboard metrics. This scales poorly as the array grows, especially since it blocks the main thread.
**Action:** Consolidate multiple derived data calculations into a single `useMemo` block with a single `for` loop. This reduces algorithmic complexity from O(M*N) to O(N) and prevents unnecessary recalculations.
