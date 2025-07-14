import { useEffect, useRef } from 'react';
import { useNotifications } from './useNotifications';

interface NotificationGeneratorProps {
  packages: any[];
  trips: any[];
  currentUser: any;
}

export const useNotificationGenerator = ({ packages, trips, currentUser }: NotificationGeneratorProps) => {
  const { createNotification } = useNotifications(currentUser?.id);
  const lastStateRef = useRef<string>('');

  // Generate notifications based on system state changes
  useEffect(() => {
    if (!currentUser || !packages || !trips) return;

    // Create a hash of the current state to avoid duplicate notifications
    const currentStateHash = JSON.stringify({
      packages: packages.map(p => ({ id: p.id, status: p.status, user_id: p.user_id })),
      trips: trips.map(t => ({ id: t.id, status: t.status, user_id: t.user_id })),
      userId: currentUser.id,
      role: currentUser.role
    });

    // Skip if state hasn't changed
    if (lastStateRef.current === currentStateHash) return;
    lastStateRef.current = currentStateHash;

    const generateNotificationsForUser = async () => {
      const userRole = currentUser.role;

      // Admin notifications - only for significant pending items
      if (userRole === 'admin') {
        const pendingPackages = packages.filter(pkg => pkg.status === 'pending_approval');
        const pendingTrips = trips.filter(trip => trip.status === 'pending_approval');
        const paymentsToConfirm = packages.filter(pkg => pkg.status === 'payment_pending');
        
        // Only create notifications if there are items to review
        if (pendingPackages.length > 0) {
          await createNotification(
            currentUser.id,
            'Solicitudes pendientes de aprobación',
            `Tienes ${pendingPackages.length} pedidos esperando aprobación`,
            'approval',
            'normal'
          );
        }

        if (paymentsToConfirm.length > 0) {
          await createNotification(
            currentUser.id,
            'Pagos pendientes de confirmación',
            `Tienes ${paymentsToConfirm.length} pagos esperando confirmación`,
            'payment',
            'high'
          );
        }
      }

      // User notifications - more targeted based on specific status changes
      if (userRole === 'user' || userRole === 'shopper') {
        const userPackages = packages.filter(pkg => pkg.user_id === currentUser.id);
        
        // High priority notifications for critical status changes
        const criticalUpdates = userPackages.filter(pkg => 
          ['quote_sent', 'delivered_to_office', 'matched'].includes(pkg.status)
        );

        criticalUpdates.forEach(async (pkg) => {
          let title = '';
          let message = '';
          let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';

          switch (pkg.status) {
            case 'quote_sent':
              title = 'Nueva cotización recibida';
              message = `Has recibido una cotización para "${pkg.item_description}"`;
              priority = 'high';
              break;
            case 'matched':
              title = 'Viajero asignado';
              message = `Tu pedido "${pkg.item_description}" ha sido asignado a un viajero`;
              break;
            case 'delivered_to_office':
              title = '¡Pedido entregado!';
              message = `Tu pedido "${pkg.item_description}" está listo para recoger en la oficina`;
              priority = 'urgent';
              break;
          }

          if (title) {
            await createNotification(
              currentUser.id,
              title,
              message,
              'package',
              priority
            );
          }
        });
      }

      // Traveler notifications
      if (userRole === 'user' || userRole === 'traveler') {
        const userTrips = trips.filter(trip => trip.user_id === currentUser.id);
        const userTripIds = userTrips.map(trip => trip.id);
        const assignedPackages = packages.filter(pkg => userTripIds.includes(pkg.matched_trip_id));

        // Important traveler notifications
        const importantUpdates = assignedPackages.filter(pkg => 
          ['matched', 'quote_accepted', 'purchase_confirmed'].includes(pkg.status)
        );

        importantUpdates.forEach(async (pkg) => {
          let title = '';
          let message = '';
          let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';

          switch (pkg.status) {
            case 'matched':
              title = 'Nuevo pedido asignado';
              message = `Se te ha asignado: "${pkg.item_description}"`;
              priority = 'high';
              break;
            case 'quote_accepted':
              title = 'Cotización aceptada';
              message = `El shopper aceptó tu cotización para "${pkg.item_description}"`;
              break;
            case 'purchase_confirmed':
              title = 'Listo para recoger';
              message = `Puedes recoger "${pkg.item_description}" - compra confirmada`;
              priority = 'high';
              break;
          }

          if (title) {
            await createNotification(
              currentUser.id,
              title,
              message,
              'package',
              priority
            );
          }
        });
      }
    };

    // Debounce to avoid too many notifications
    const timeoutId = setTimeout(generateNotificationsForUser, 2000);
    return () => clearTimeout(timeoutId);
  }, [packages, trips, currentUser, createNotification]);
};