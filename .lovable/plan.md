

## Update PackageStatusTimeline for Multi-Assignment Flow

### Changes — `src/components/PackageStatusTimeline.tsx`

Remove the `quote_sent` and `quote_accepted` entries from the statuses array (lines 29-40). The flow becomes:

```
pending_approval → approved → matched → payment_pending → payment_pending_approval → pending_purchase → in_transit → received_by_traveler → ... → completed
```

Update the `matched` step description to reflect the new flow:
- Label: "Cotización aceptada" 
- Description: "Seleccionaste un viajero y aceptaste la cotización"

Also handle the `quote_sent` and `quote_accepted` legacy statuses in `getStatusState` by mapping them to `matched` index so legacy packages still render correctly.

