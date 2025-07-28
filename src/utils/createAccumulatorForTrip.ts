import { createOrUpdateTripPaymentAccumulator } from '@/hooks/useCreateTripPaymentAccumulator';

// Función utilitaria para crear el acumulador del viaje actual
export const createAccumulatorForCurrentTrip = async () => {
  const tripId = '01cafd38-85e6-468b-bca6-2df0604097dd';
  const travelerId = '5e3c944e-9130-4ea7-8165-b8ec9d5abf6f';
  
  return await createOrUpdateTripPaymentAccumulator(tripId, travelerId);
};