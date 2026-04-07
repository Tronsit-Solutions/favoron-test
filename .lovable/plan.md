

## Corregir número de WhatsApp de Luisa Torres

### Problema
El perfil de Luisa Torres (id: `df6ee4fc-5a96-4d27-8531-fce7bf6fcfb7`) tiene el número `50240043886` en el campo `phone_number`, que ya incluye el código de país `502`. Combinado con `country_code: +502`, el sistema genera `+50250240043886` — un número inválido para Twilio/WhatsApp.

### Solución
Ejecutar una migración SQL para corregir el número:

```sql
UPDATE profiles
SET phone_number = '40043886'
WHERE id = 'df6ee4fc-5a96-4d27-8531-fce7bf6fcfb7';
```

Esto deja el perfil como:
- `country_code`: `+502`
- `phone_number`: `40043886`
- Resultado al enviar WhatsApp: `+50240043886` (formato correcto)

### Archivo a modificar
- Nueva migración SQL (solo un UPDATE de datos)

