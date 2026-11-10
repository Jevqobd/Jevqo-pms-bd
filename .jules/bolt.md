## 2024-05-18 - Optimized DashboardStats with O(N) array processing and React.memo
**Learning:** Found an instance of O(7N) array processing in DashboardStats that could be optimized to O(N) along with preventing unnecessary re-renders using React.memo.
**Action:** Replaced separate `.filter()` and `.reduce()` calls over the same large `orders` array with a single `useMemo` pass.
