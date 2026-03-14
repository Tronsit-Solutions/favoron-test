

## Add Average Monthly Growth to Revenue Chart

### What
Add an "Avg MoM" metric below the current MoM indicator in the ServiceFeeGrowthChart, showing the average month-over-month growth rate across all months with revenue data.

### Changes

**`src/components/admin/charts/ServiceFeeGrowthChart.tsx`**

1. Calculate average monthly growth: iterate over `chartData`, compute each month's MoM % change (skipping months where previous = 0), then average them
2. Display it below the existing MoM line as a second line like `~X.X% Avg MoM` in a muted color

The calculation will only consider months that have a non-zero previous month, giving a meaningful average growth rate.

