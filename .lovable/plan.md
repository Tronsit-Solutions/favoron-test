

## Agregar Tabla de Respuestas de Encuesta de Adquisición

### Objetivo
Mostrar una tabla detallada con las respuestas individuales de los usuarios a la encuesta "¿Cómo nos conociste?", incluyendo nombre, canal, referidor (si aplica) y fecha de respuesta.

### Cambios a realizar

#### 1. Crear nuevo hook `useAcquisitionSurveyResponses`
**Archivo:** `src/hooks/useAcquisitionSurveyResponses.tsx`

Consulta a la tabla `profiles` para obtener:
- Nombre completo del usuario
- Email
- Canal de adquisición (`acquisition_source`)
- Nombre del referidor (`referrer_name`) 
- Fecha de respuesta (`acquisition_source_answered_at`)
- Fecha de registro (`created_at`)

Ordenado por fecha de respuesta más reciente.

#### 2. Crear componente `AcquisitionSurveyTable`
**Archivo:** `src/components/admin/charts/AcquisitionSurveyTable.tsx`

Tabla con las siguientes columnas:
| Usuario | Email | Canal | Referidor | Fecha Respuesta |
|---------|-------|-------|-----------|-----------------|
| Jonathan Menendez | jonathanmenendez00@gmail.com | TikTok | - | 3 Feb 2026 |
| Mauricio Izquierdo | jmauricio.izquierdo@gmail.com | Referidos | (nombre si hay) | 3 Feb 2026 |

Características:
- Paginación o scroll infinito (para manejar muchos usuarios)
- Badge con colores por canal (mismo estilo del gráfico existente)
- Mostrar referidor solo cuando aplica (`friend_referral`)
- Formato de fecha legible

#### 3. Integrar en `DynamicReportsTab`
**Archivo:** `src/components/admin/DynamicReportsTab.tsx`

Agregar el nuevo componente debajo del `AcquisitionChart` existente, con un título como "Respuestas Individuales" o "Detalle por Usuario".

### Detalles técnicos

```text
AcquisitionChart (existente - gráfico agregado)
        │
        ▼
AcquisitionSurveyTable (nuevo - respuestas individuales)
    - Hook: useAcquisitionSurveyResponses
    - Query: SELECT from profiles WHERE acquisition_source IS NOT NULL
    - Limit: 50 registros con opción "Ver más"
```

### Mapeo de canales (reutilizar del existente)
- `tiktok` → "TikTok"
- `instagram_facebook_ads` → "Meta (Instagram/Facebook)"
- `reels` → "Reels"
- `friend_referral` → "Referidos"
- `other` → "Otro"

