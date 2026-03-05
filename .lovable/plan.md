

## Agregar crédito de referidos a la tabla de resumen financiero

Sí, lo más sencillo es sumarlo a la columna de descuento existente (`discountAmount`). El crédito de referidos ya se guarda en el quote JSON como `referralCreditAmount`, así que solo hay que incluirlo en la lectura.

### Cambios

**1. `src/lib/quoteHelpers.ts` - `getQuoteValues()`**

Agregar lectura de `referralCreditAmount` del quote y sumarlo al `discountAmount` existente. También exponer el campo por separado para quien lo necesite:

```typescript
// En QuoteValues interface, agregar:
referralCreditAmount: number;

// En getQuoteValues(), leer:
const referralCreditAmount = Number(quote.referralCreditAmount || 0);

// Sumar al discountAmount total:
const totalDiscount = discountAmount + referralCreditAmount;

// Y usar totalDiscount como el discountAmount retornado
// finalTotalPrice = totalPrice - totalDiscount
```

Esto automáticamente propaga el descuento a la tabla financiera y a todos los componentes que usan `getQuoteValues`, sin necesidad de tocar `FinancialSummaryTable.tsx` ni ningún otro archivo.

**2. Verificación**

La columna "Descuento" en la tabla financiera ya muestra `discountAmount` de `getQuoteValues()`, así que al incluir el crédito de referidos ahí, aparecerá automáticamente sumado. El `finalTotalPrice` también se ajustará correctamente.

### Impacto
- Un solo archivo modificado: `quoteHelpers.ts`
- Todos los componentes que consumen `getQuoteValues` reflejarán el descuento combinado (código de descuento + crédito de referidos)
- La tabla financiera mostrará el total correcto sin cambios adicionales

