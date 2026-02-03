

## Agregar Columna "Canal" al Timeline de Actividad

### Objetivo
Mostrar el canal de adquisición de cada usuario en la tabla del Timeline de Actividad para poder correlacionar la fuente de marketing con los viajes y solicitudes que hacen.

### Cambios a realizar

#### 1. Modificar el hook `useActivityTimeline`
**Archivo:** `src/hooks/useActivityTimeline.tsx`

- Agregar `acquisition_source` al SELECT de profiles en las queries de trips y packages
- Agregar campo `acquisitionChannel` a la interface `ActivityItem`
- Incluir el canal en los objetos de actividad

```typescript
// En la interface ActivityItem agregar:
acquisitionChannel: string | null;

// En las queries, modificar el select de profiles:
profiles!trips_user_id_fkey (first_name, last_name, phone_number, email, acquisition_source)
```

#### 2. Modificar el componente `ActivityTimelineTab`
**Archivo:** `src/components/admin/ActivityTimelineTab.tsx`

- Agregar columna "Canal" en el TableHeader (después de WhatsApp)
- Agregar Badge con color según el canal en ActivityRow
- Actualizar el export a Excel para incluir el canal
- Agregar Skeleton adicional para la nueva columna

#### 3. Mapeo de canales (reutilizar estilo existente)
| Valor | Label | Color |
|-------|-------|-------|
| `tiktok` | TikTok | Rosa |
| `instagram_facebook_ads` | Meta | Azul |
| `reels` | Reels | Morado |
| `friend_referral` | Referidos | Verde |
| `other` | Otro | Gris |
| `null` | Sin respuesta | Gris claro |

### Resultado visual esperado

| Usuario | WhatsApp | Canal | Tipo | Detalle | Fecha | Estado | Info |
|---------|----------|-------|------|---------|-------|--------|------|
| Sabina Sigüenza | 56279846 | TikTok | Pedido | Vitaminas... | 03 feb 26 | matched | - |
| Diego Cabrera | 49494919 | Referidos | Pedido | Whoop peak | 03 feb 26 | Cotización enviada | Q210 |

