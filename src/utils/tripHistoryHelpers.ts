import { supabase } from '@/integrations/supabase/client';

export interface TripHistoryEntry {
  event_type: 
    | 'trip_created'
    | 'trip_edited'
    | 'trip_approved'
    | 'trip_rejected'
    | 'package_assigned'
    | 'package_unassigned'
    | 'status_change';
  timestamp: string;
  actor_id: string | null;
  actor_name: string;
  details: Record<string, any>;
}

export const createHistoryEntry = (
  eventType: TripHistoryEntry['event_type'],
  actorId: string | null,
  actorName: string,
  details: Record<string, any>
): TripHistoryEntry => ({
  event_type: eventType,
  timestamp: new Date().toISOString(),
  actor_id: actorId,
  actor_name: actorName,
  details,
});

/**
 * Appends a new history entry to a trip's trip_history_log.
 * Reads current log first to avoid race conditions.
 */
export const appendTripHistoryEntry = async (
  tripId: string,
  entry: TripHistoryEntry
): Promise<void> => {
  try {
    // Read current log
    const { data, error: readError } = await supabase
      .from('trips')
      .select('trip_history_log')
      .eq('id', tripId)
      .single();

    if (readError) {
      console.error('Error reading trip_history_log:', readError);
      return;
    }

    const currentLog = Array.isArray(data?.trip_history_log) ? data.trip_history_log : [];
    const updatedLog = [...currentLog, entry];

    const { error: updateError } = await supabase
      .from('trips')
      .update({ trip_history_log: updatedLog } as any)
      .eq('id', tripId);

    if (updateError) {
      console.error('Error updating trip_history_log:', updateError);
    }
  } catch (error) {
    console.error('Error appending trip history entry:', error);
  }
};

/**
 * Builds a history entry for trip edits by diffing old vs new values.
 */
export const buildEditDiff = (
  originalTrip: any,
  newData: Record<string, any>
): { changed_fields: string[]; previous_values: Record<string, any>; new_values: Record<string, any> } => {
  const fieldsToCompare = [
    'from_city', 'to_city', 'from_country', 'to_country',
    'arrival_date', 'delivery_date', 'first_day_packages', 'last_day_packages',
    'available_space', 'delivery_method',
  ];

  const changed_fields: string[] = [];
  const previous_values: Record<string, any> = {};
  const new_values: Record<string, any> = {};

  for (const field of fieldsToCompare) {
    if (newData[field] !== undefined) {
      const oldVal = originalTrip[field];
      const newVal = newData[field];

      // For dates, compare normalized strings
      if (field.includes('date') || field.includes('day_packages')) {
        const oldDate = oldVal ? new Date(oldVal).toISOString().split('T')[0] : null;
        const newDate = newVal ? new Date(newVal).toISOString().split('T')[0] : null;
        if (oldDate !== newDate) {
          changed_fields.push(field);
          previous_values[field] = oldVal;
          new_values[field] = newVal;
        }
      } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changed_fields.push(field);
        previous_values[field] = oldVal;
        new_values[field] = newVal;
      }
    }
  }

  // Compare address separately (deep compare)
  if (newData.package_receiving_address !== undefined) {
    if (JSON.stringify(originalTrip.package_receiving_address) !== JSON.stringify(newData.package_receiving_address)) {
      changed_fields.push('package_receiving_address');
      previous_values['package_receiving_address'] = originalTrip.package_receiving_address;
      new_values['package_receiving_address'] = newData.package_receiving_address;
    }
  }

  // Compare messenger info
  if (newData.messenger_pickup_info !== undefined) {
    if (JSON.stringify(originalTrip.messenger_pickup_info) !== JSON.stringify(newData.messenger_pickup_info)) {
      changed_fields.push('messenger_pickup_info');
      previous_values['messenger_pickup_info'] = originalTrip.messenger_pickup_info;
      new_values['messenger_pickup_info'] = newData.messenger_pickup_info;
    }
  }

  return { changed_fields, previous_values, new_values };
};

/** Human-readable field name mapping */
export const fieldLabelMap: Record<string, string> = {
  from_city: 'Ciudad de origen',
  to_city: 'Ciudad de destino',
  from_country: 'País de origen',
  to_country: 'País de destino',
  arrival_date: 'Fecha de llegada',
  delivery_date: 'Fecha de entrega',
  first_day_packages: 'Primer día para recibir paquetes',
  last_day_packages: 'Último día para recibir paquetes',
  available_space: 'Espacio disponible (kg)',
  delivery_method: 'Método de entrega',
  package_receiving_address: 'Dirección para recibir paquetes',
  messenger_pickup_info: 'Info de mensajero',
};
