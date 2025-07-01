
import { useToast } from "@/hooks/use-toast";

export const useTripActions = (
  trips: any[],
  setTrips: (trips: any[]) => void,
  currentUser: any,
  setShowTripForm: (show: boolean) => void
) => {
  const { toast } = useToast();

  const handleTripSubmit = (tripData: any) => {
    const newTrip = {
      id: Date.now(),
      ...tripData,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
      userId: currentUser.id
    };
    setTrips([...trips, newTrip]);
    setShowTripForm(false);
    toast({
      title: "¡Viaje registrado!",
      description: "Tu viaje ha sido registrado exitosamente. Está en revisión.",
    });
  };

  return {
    handleTripSubmit
  };
};
