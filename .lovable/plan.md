
## Desactivar A/B Test - Todos los usuarios al Grupo A

### Análisis
El grupo A (tono familiar) tiene **2.2x mejor conversión** que el grupo B:
- Grupo A: 0.97% de conversión (6/621)
- Grupo B: 0.44% de conversión (3/675)

### Cambio propuesto
Modificar la función `handle_new_user()` para que todos los nuevos usuarios sean asignados automáticamente al **Grupo A**.

### Detalle técnico
Actualizar la línea de asignación de grupo en la función:

```text
-- ANTES:
CASE WHEN random() < 0.5 THEN 'A' ELSE 'B' END

-- DESPUÉS:
'A'  -- A/B test desactivado: Grupo A tiene mejor conversión
```

### Archivos a modificar
1. **Nueva migración SQL** - Redefinir `public.handle_new_user()` con la asignación fija a 'A'

### Resultado esperado
- Todos los nuevos usuarios recibirán el email de bienvenida del **Grupo A** (tono familiar y cercano)
- Los usuarios existentes mantienen su grupo asignado (no afecta datos históricos)
- La edge function `send-welcome-email` seguirá funcionando igual - simplemente siempre recibirá `ab_test_group: 'A'`
