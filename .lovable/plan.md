

## Fix: Remove required markers from "Nombre del lugar" field

### Problem
The "Nombre del lugar" field still shows `*` in the label and has `required` on the `<Input>`, even though it was supposed to be made optional.

### Change — `src/components/EditTripModal.tsx`

**Line 682**: Remove the `*` from the label text:
- `Nombre del lugar (Ej: Hotel Barceló, Condominio El Prado, etc.) *` → `Nombre del lugar (Ej: Hotel Barceló, Condominio El Prado, etc.)`

**Line 685**: Remove `required` attribute from the Input element.

