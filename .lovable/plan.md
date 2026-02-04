
## Aclarar Texto del Campo de Empaque Original

### Cambio
Actualizar el texto descriptivo en `PackageRequestForm.tsx` para distinguir entre el empaque del producto y la caja de envío.

### Texto actual
```
"Indica si es importante conservar el empaque de fábrica"
```

### Texto nuevo propuesto
```
"Empaque del producto (ej: caja del iPhone), no la caja de envío"
```

### Archivos a modificar
- `src/components/PackageRequestForm.tsx` - Actualizar en 2 lugares (online y personal)

### Ubicaciones
1. Línea ~1005 (productos online)
2. Línea ~1121 (productos personales)
