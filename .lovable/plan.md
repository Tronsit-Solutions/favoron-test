

## Plan

### 1. Fix `useDashboardActions.tsx` (line 33, 1291-1299)

**Line 33**: Destructure `fees` alongside `rates` from `usePlatformFeesContext()`:
```ts
const { rates, fees } = usePlatformFeesContext();
```

**Lines 1291-1299**: Read `cityArea` from `confirmed_delivery_address` and pass `fees` to `createNormalizedQuote`:
```ts
const confirmedAddress = currentPackage.confirmed_delivery_address as any;
const cityArea = confirmedAddress?.cityArea;

const normalizedQuote = createNormalizedQuote(
  currentPackage.admin_assigned_tip,
  currentPackage.delivery_method || 'pickup',
  shopperProfile.trust_level,
  `Cotización generada automáticamente por admin`,
  true,
  cityArea || currentPackage.package_destination,
  rates,
  fees  // pass dynamic delivery fees
);
```

### 2. Fix existing package quote via SQL

Use the insert tool to update the specific package's quote JSON, changing `deliveryFee` from 60 to 45 and `totalPrice` accordingly (subtract 15). This requires identifying the package ID for the "Serum, Sun Serum Bloqueador, Oliovita" order first, then running an UPDATE on the `packages` table's `quote` JSONB field.

