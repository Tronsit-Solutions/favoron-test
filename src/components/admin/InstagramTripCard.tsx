interface Trip {
  id: string;
  from_city: string;
  to_city: string;
  arrival_date: string;
}

interface InstagramTripCardProps {
  trip: Trip;
}

export const InstagramTripCard = ({ trip }: InstagramTripCardProps) => {
  return (
    <div className="bg-white rounded-xl p-4 mx-2 flex flex-col items-center justify-center text-center">
      <div className="flex items-center text-2xl font-bold text-gray-800 mb-2">
        <span>{trip.from_city}</span>
        <span className="text-teal-500 mx-2">→</span>
        <span>{trip.to_city}</span>
      </div>
      <div className="text-xl font-medium text-gray-600">
        <span>{new Date(trip.arrival_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
    </div>
  );
};