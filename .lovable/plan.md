
## Agregar Detalle de Paquetes al Excel de Viajes

### Problema Identificado
La funcion `handleExportExcel` en `ActivityTimelineTab.tsx` exporta solo los conteos de paquetes:
- `Paquetes Confirmados`: numero
- `Paquetes Completados`: numero

Pero no incluye el campo `confirmedPackageDescriptions` que contiene la lista de descripciones de los paquetes asignados a cada viaje.

---

### Solucion

Agregar una nueva columna "Detalle Paquetes" al export de Excel que concatene las descripciones de los paquetes confirmados.

---

### Cambio Tecnico

**Archivo: src/components/admin/ActivityTimelineTab.tsx**

En la funcion `handleExportExcel`, modificar el objeto de exportacion para viajes (lineas 84-96):

```tsx
if (item.type === 'trip') {
  return {
    'Tipo': 'Viaje',
    'Usuario': item.userName,
    'WhatsApp': item.userPhone || 'N/A',
    'Canal': getChannelLabel(item.acquisitionChannel),
    'Email': item.userEmail || 'N/A',
    'Ruta': item.description,
    'Fecha Llegada': item.arrivalDate ? format(new Date(item.arrivalDate), 'dd/MM/yyyy') : 'N/A',
    'Fecha Creación': format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm'),
    'Estado': item.statusLabel,
    'Paquetes Confirmados': item.confirmedPackages ?? '',
    'Paquetes Completados': item.completedPackages ?? '',
    'Detalle Paquetes': item.confirmedPackageDescriptions?.join(' | ') || 'Sin paquetes',
  };
}
```

---

### Resultado

El Excel de viajes incluira una columna adicional "Detalle Paquetes" con las descripciones de todos los paquetes asignados, separados por ` | ` para facilitar lectura.

Ejemplo de valor en la celda:
```
iPhone 15 Pro Max | MacBook Air M2 | AirPods Pro
```
