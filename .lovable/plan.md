

## Persistir el paso actual del formulario de viaje

### Problema
Cuando el usuario sale del sitio (para ver información de su viaje) y regresa, el modal se resetea al paso 1 (VIAJE) aunque estaba en el paso 2 (Dirección). Esto ocurre porque:
1. El `currentStep` no se persiste - solo se guarda en memoria
2. El `useEffect` siempre resetea al paso inicial cuando `isOpen` cambia

### Solución
Incluir el `currentStep` dentro del estado que ya se persiste con `useFormAutosave`.

### Cambios en src/components/TripForm.tsx

#### 1. Agregar currentStep al estado inicial del formulario (línea 49)
```tsx
const getInitialFormState = () => ({
  currentStep: 0, // NUEVO: Agregar paso actual
  formData: {
    // ... resto igual
  },
  messengerData: null as any,
  acceptedTerms: false,
  showTermsModal: false,
  showMessengerForm: false
});
```

#### 2. Eliminar el estado separado de currentStep (líneas 91-93)
```tsx
// ELIMINAR estas líneas:
// const [currentStep, setCurrentStep] = useState(0);
const [skipIntroduction, setSkipIntroduction] = useState(false);
// totalSteps se mantiene
const totalSteps = 4;
```

#### 3. Crear helper para currentStep
```tsx
// Acceder al paso desde el estado persistido
const currentStep = formState.currentStep ?? 0;
const setCurrentStep = (step: number | ((prev: number) => number)) => {
  if (typeof step === 'function') {
    setFormState(prev => ({ ...prev, currentStep: step(prev.currentStep ?? 0) }));
  } else {
    updateField('currentStep', step);
  }
};
```

#### 4. Modificar el useEffect que resetea el paso (líneas 96-102)
```tsx
// Solo resetear si NO hay datos guardados del formulario
useEffect(() => {
  if (isOpen) {
    // Si hay un paso guardado, usarlo; si no, verificar preferencia de intro
    const hasSavedStep = formState.currentStep !== undefined && formState.currentStep > 0;
    if (!hasSavedStep) {
      const shouldSkip = profile?.ui_preferences?.skip_trip_intro === true;
      setCurrentStep(shouldSkip ? 1 : 0);
    }
    setSkipIntroduction(false);
  }
}, [isOpen]);
```

#### 5. Resetear paso en handleSubmit exitoso (línea 364)
Este ya está correcto - al hacer submit exitoso se llama `resetFormDraft()` que limpia todo.

### Resultado esperado
- El usuario en paso 2 sale del sitio para ver información de su viaje
- Al regresar, el modal mantiene el paso 2 con todos los datos ingresados
- Solo se resetea al paso inicial cuando:
  - El usuario completa y envía el formulario
  - El usuario cierra el modal y el borrador expira
  - El usuario limpia manualmente el borrador

### Notas técnicas
- El paso se guarda en `localStorage` junto con los demás datos del formulario
- El debounce de 400ms aplica igual que para los otros campos
- El key del storage es `trip-form-create:/dashboard/trip`

