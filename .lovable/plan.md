

## Plan: Optimizar carga de datos del viajero en AdminMatchDialog

### Problema

Cuando el admin selecciona un viajero en el diálogo de match, se ejecutan **3 rondas secuenciales** de queries a Supabase:

1. **Ronda 1** (paralela): 4 queries — referral, direct packages, bidding assignments, all assignments
2. **Ronda 2** (secuencial): fetch del perfil del referidor + fetch de bidding packages faltantes
3. **Ronda 3** (secuencial): fetch de packages faltantes para la sección de asignaciones

Cada ronda agrega ~200-500ms de latencia de red. Total: hasta 1.5s+ solo en red, sin contar procesamiento.

### Solución

Reorganizar las queries para eliminar las rondas secuenciales:

**Archivo: `src/components/admin/AdminMatchDialog.tsx` (~líneas 632-770)**

1. **Mover el fetch del referrer profile a la Ronda 1**: En lugar de esperar el resultado de `referralResult` para luego hacer otro query, hacer el fetch del perfil del referidor directamente en paralelo usando un approach de "fetch all referrer profiles" o simplemente moverlo al batch inicial con un join.

2. **Combinar los fetches de packages faltantes (Rondas 2 y 3)**: Actualmente se hacen dos queries separadas para `missingBiddingIds` y `missingAssignPkgIds`. Unificarlos en un solo query con todos los IDs faltantes combinados.

3. **Resultado**: De 3 rondas secuenciales → máximo 2 rondas (la primera paralela con todo lo posible, la segunda solo para packages que no están en memoria).

### Cambio técnico

```text
ANTES:
  Ronda 1: [referral, directPkgs, biddingAssigns, allAssigns]  (paralelo)
  Ronda 2: referrerProfile + biddingPkgs                        (secuencial)  
  Ronda 3: assignmentPkgs                                       (secuencial)

DESPUÉS:
  Ronda 1: [referral+profile(join), directPkgs, biddingAssigns, allAssigns]  (paralelo)
  Ronda 2: [allMissingPkgs]  (un solo query combinando bidding + assignment IDs)
```

Esto debería reducir la latencia total en ~30-50%.

