## 2024-03-07 - Array Iterations Performance
**Learning:** In React components like DashboardStats, multiple array operations (filter, reduce) on the same dataset cause O(n) rendering bottlenecks.
**Action:** Always combine operations into a single loop using useMemo when calculating multiple metrics from the same array.
