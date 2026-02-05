
## Traducir Mensaje de Error de Contraseña a Español

### Problema
El mensaje de error de Supabase para requisitos de contraseña se muestra en inglés:
> "Password should be at least 8 characters. Password should contain at least one character of each: abcdefghijklmnopqrstuvwxyz, ABCDEFGHIJKLMNOPQRSTUVWXYZ, 0123456789, !@#$%^&*()_+-=[]{};"'|<>?,./`~."

### Solución
Agregar una condición para detectar este error y mostrar la versión en español.

---

### Cambio Técnico

**Archivo: src/pages/Auth.tsx (líneas 336-342)**

Cambiar de:
```tsx
toast({
  title: "Error al crear cuenta",
  description: error.message === "over_email_send_rate_limit" 
    ? "Has enviado demasiados emails. Espera un momento antes de intentar de nuevo."
    : error.message,
  variant: "destructive",
});
```

A:
```tsx
toast({
  title: "Error al crear cuenta",
  description: error.message === "over_email_send_rate_limit" 
    ? "Has enviado demasiados emails. Espera un momento antes de intentar de nuevo."
    : error.message?.toLowerCase().includes('password should be at least')
    ? "La contraseña debe tener al menos 8 caracteres e incluir: una letra minúscula, una letra mayúscula, un número y un carácter especial (!@#$%^&*)"
    : error.message,
  variant: "destructive",
});
```

---

### Resultado
- **Antes**: "Password should be at least 8 characters..."
- **Después**: "La contraseña debe tener al menos 8 caracteres e incluir: una letra minúscula, una letra mayúscula, un número y un carácter especial (!@#$%^&*)"
