

## Hacer obligatorio el campo de Documento de Identidad (DPI)

### Cambios

**1. `src/hooks/useProfileCompletion.tsx`**
- Agregar `document_number: 'Documento de identidad'` al objeto `requiredFields` (línea 14-18)
- Agregar `'document_number'` al array `requiredFields` en la función `isProfileComplete` (línea ~103)
- Esto hará que `RequireAuth` redirija a `/complete-profile` si falta el DPI

**2. `src/pages/CompleteProfile.tsx`**
- Incluir `formData.idNumber` en el cálculo de progreso (línea 51-54): cambiar de 3 a 4 campos
- Agregar validación en `handleSave` (línea 56-66): `if (!formData.idNumber.trim()) toast.error("El documento de identidad es obligatorio")`
- Incluir `document_number` en el update a Supabase (ya se hace en línea ~78)

**3. `src/components/profile/PersonalInfoForm.tsx`**
- Agregar asterisco `*` al label del campo "Documento de identidad" para indicar visualmente que es obligatorio

### Resultado
- El DPI será obligatorio para completar el perfil
- Usuarios sin DPI serán redirigidos a `/complete-profile`
- El progreso se calculará sobre 4 campos en vez de 3

