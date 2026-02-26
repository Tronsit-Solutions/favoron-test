

## Plan: Add GMV Evolution Chart to Dashboard

### 1. Create `src/components/admin/charts/GMVChart.tsx`

- New chart component similar to `AvgPackageValueChart` style
- Area/Bar chart showing monthly GMV evolution with accumulated GMV line
- Props: `data` (monthlyData array with `monthLabel`, `gmv`, `favoronRevenue`, `travelerTips`)
- Show total GMV in header, MoM growth indicator
- Use `ComposedChart` with Bar for monthly GMV and Line for accumulated GMV
- Format values as `Q` currency

### 2. Update `src/components/admin/DynamicReportsTab.tsx`

- Import `GMVChart`
- Add it to the charts grid (after TripsChart, before AvgPackageValueChart), making the grid have 3 charts in the second row

