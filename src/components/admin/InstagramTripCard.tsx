import { useState } from "react";

interface Trip {
  id: string;
  from_city: string;
  to_city: string;
  arrival_date: string;
}

interface InstagramTripCardProps {
  trip: Trip;
  onTripUpdate?: (updatedTrip: Trip) => void;
}

export const InstagramTripCard = ({ trip, onTripUpdate }: InstagramTripCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTrip, setEditedTrip] = useState(trip);

  const handleSave = () => {
    if (onTripUpdate) {
      onTripUpdate(editedTrip);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTrip(trip);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl p-6 mx-2 flex items-center justify-center min-h-[80px] relative group">
      {!isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-200 hover:bg-gray-300 rounded-full p-1 text-xs"
        >
          ✏️
        </button>
      )}
      
      {isEditing ? (
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex items-center text-3xl font-bold text-gray-800 gap-2">
            <input
              type="text"
              value={editedTrip.from_city}
              onChange={(e) => setEditedTrip({ ...editedTrip, from_city: e.target.value })}
              className="bg-transparent border-b border-gray-400 outline-none text-center min-w-0 flex-1"
            />
            <span className="text-teal-500">→</span>
            <input
              type="text"
              value={editedTrip.to_city}
              onChange={(e) => setEditedTrip({ ...editedTrip, to_city: e.target.value })}
              className="bg-transparent border-b border-gray-400 outline-none text-center min-w-0 flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={editedTrip.arrival_date}
              onChange={(e) => setEditedTrip({ ...editedTrip, arrival_date: e.target.value })}
              className="bg-transparent border-b border-gray-400 outline-none text-center text-3xl font-medium text-gray-600"
            />
            <button
              onClick={handleSave}
              className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm"
            >
              ✓
            </button>
            <button
              onClick={handleCancel}
              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full">
        <div className="flex items-center text-3xl font-bold text-gray-800">
          <span className="capitalize">{trip.from_city.toLowerCase()}</span>
          <span className="text-teal-500 mx-2">→</span>
          <span className="capitalize">{trip.to_city.toLowerCase()}</span>
        </div>
          <div className="flex items-center text-3xl font-medium text-gray-600">
            <span>{new Date(trip.arrival_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      )}
    </div>
  );
};