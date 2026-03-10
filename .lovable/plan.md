

## Plan: "Trabaja con nosotros" — Formulario público + Sección admin

### Resumen
Agregar un botón "Trabaja con nosotros" en el footer y/o navbar del landing page que abra una página pública donde cualquier persona pueda enviar su información (nombre, email, teléfono, CV/documentos, tipo de interés: talento o colaborador, mensaje). Los datos y archivos se guardan en Supabase y se visualizan en una nueva sección del panel admin.

### Cambios

#### 1. Base de datos
- **Nueva tabla `job_applications`**: `id`, `full_name`, `email`, `phone`, `interest_type` (enum: 'talent', 'collaborator'), `message`, `resume_url`, `resume_filename`, `status` ('pending', 'reviewed', 'contacted', 'rejected'), `admin_notes`, `created_at`, `updated_at`
- **RLS**: INSERT público (anon + authenticated), SELECT/UPDATE solo admins
- **Storage bucket `job-applications`**: público para upload, lectura solo admin

#### 2. Página pública `/trabaja-con-nosotros`
- Nueva página `src/pages/WorkWithUs.tsx` con formulario:
  - Nombre completo, email, teléfono
  - Tipo de interés: "Quiero trabajar en Favorón" / "Quiero colaborar con Favorón"
  - Mensaje / carta de presentación (textarea)
  - Upload de CV/documentos (PDF, imagen)
  - Botón enviar con validación zod
- NavBar + Footer incluidos, no requiere autenticación

#### 3. Ruta en App.tsx
- Agregar `<Route path="/trabaja-con-nosotros" element={<WorkWithUs />} />`

#### 4. Botón en Footer
- Agregar link "Trabaja con nosotros" en la sección "Enlaces útiles" del Footer

#### 5. Sección admin — `AdminApplicationsTab.tsx`
- Nueva pestaña "Aplicaciones" en el `AdminDashboard` (7mo tab)
- Tabla con: nombre, email, tipo, fecha, status badge
- Click para ver detalle: mensaje completo, descargar CV, cambiar status, agregar notas admin
- Filtros por tipo de interés y status

#### Archivos a crear
- `src/pages/WorkWithUs.tsx`
- `src/components/admin/AdminApplicationsTab.tsx`
- `src/components/admin/ApplicationDetailModal.tsx`

#### Archivos a modificar
- `src/App.tsx` — nueva ruta
- `src/components/Footer.tsx` — link "Trabaja con nosotros"
- `src/components/AdminDashboard.tsx` — nueva pestaña "Aplicaciones"

#### Migración SQL
- Crear tabla `job_applications`
- Crear bucket `job-applications`
- RLS policies

