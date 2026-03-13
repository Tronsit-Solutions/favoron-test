

## Update landing page stats with real numbers

### Real values from database
| Metric | Current (snapshot) | Real value | Source |
|---|---|---|---|
| Users | 1,255 | **1,876** | `profiles` count |
| Trips | 220 | **351** | `trips` count |
| Packages completed | 520 | **412** | packages in completed/post-office statuses |
| Tips distributed | Q37,070 | **Q40,539** | `quote.price` sum from paid packages only (with `payment_receipt`) |

### Changes

**1. Update `platform_stats_snapshot` table** (data update via insert tool)
Set the 4 values to the real numbers above.

**2. Update fallback values in `src/hooks/usePublicStats.tsx`** (lines 14-18)
Change hardcoded fallbacks to match real values so they're accurate even if the RPC fails.

