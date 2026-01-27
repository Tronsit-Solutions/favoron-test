

# Plan: Guatemala Solo en Pedido Personal

## Problema

Guatemala se agregó al array `purchaseOrigins` que se usa para **ambos** tipos de solicitud:
- **Compra Online**: "¿En qué país está la TIENDA?" - Guatemala NO debe aparecer
- **Pedido Personal**: "¿En qué país está tu PAQUETE?" - Guatemala SÍ debe aparecer

## Solución

Crear dos arrays separados: uno para compra online (sin Guatemala) y otro para pedido personal (con Guatemala).

---

## Cambio Requerido

**Archivo:** `src/components/PackageRequestForm.tsx`

### 1. Separar los arrays de origen (líneas 241-247)

```typescript
// Para compra online - sin Guatemala (tiendas extranjeras)
const onlinePurchaseOrigins = [
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'España', label: 'España' },
  { value: 'México', label: 'México' },
  { value: 'Otro', label: 'Otro' }
];

// Para pedido personal - con Guatemala (paquete puede estar localmente)
const personalPackageOrigins = [
  { value: 'Guatemala', label: 'Guatemala' },
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'España', label: 'España' },
  { value: 'México', label: 'México' },
  { value: 'Otro', label: 'Otro' }
];
```

### 2. Usar el array correcto según el tipo (línea 777)

```tsx
{(formRequestType === 'personal' ? personalPackageOrigins : onlinePurchaseOrigins).map((origin) => (
  <SelectItem key={origin.value} value={origin.value}>
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4" />
      <span>{origin.label}</span>
    </div>
  </SelectItem>
))}
```

---

## Resumen

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `PackageRequestForm.tsx` | 241-247 | Separar en 2 arrays: `onlinePurchaseOrigins` y `personalPackageOrigins` |
| `PackageRequestForm.tsx` | 777 | Condicionar qué array usar según `formRequestType` |

---

## Resultado

| Tipo de Solicitud | Opciones Mostradas |
|-------------------|-------------------|
| **Compra Online** | Estados Unidos, España, México, Otro |
| **Pedido Personal** | **Guatemala**, Estados Unidos, España, México, Otro |

