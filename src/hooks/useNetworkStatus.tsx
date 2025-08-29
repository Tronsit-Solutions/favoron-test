import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NetworkInfo {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  isSafari: boolean;
  isMobile: boolean;
}

export function useNetworkStatus() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown',
    isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
    isMobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
  });
  
  const { toast } = useToast();

  useEffect(() => {
    const updateNetworkInfo = () => {
      const nav = navigator as any;
      const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
      
      const newNetworkInfo: NetworkInfo = {
        isOnline: navigator.onLine,
        isSlowConnection: connection ? (
          connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g' || 
          connection.downlink < 1
        ) : false,
        connectionType: connection?.effectiveType || 'unknown',
        isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
        isMobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
      };
      
      setNetworkInfo(prevInfo => {
        // Show toast when going offline
        if (prevInfo.isOnline && !newNetworkInfo.isOnline) {
          toast({
            title: "Conexión perdida",
            description: "Se perdió la conexión a internet. Reintentando automáticamente...",
            variant: "destructive",
          });
        }
        
        // Show toast when coming back online
        if (!prevInfo.isOnline && newNetworkInfo.isOnline) {
          toast({
            title: "Conexión restaurada",
            description: "La conexión a internet se ha restaurado.",
            variant: "default",
          });
        }
        
        // Warn about slow connection
        if (!prevInfo.isSlowConnection && newNetworkInfo.isSlowConnection) {
          toast({
            title: "Conexión lenta detectada",
            description: "Tu conexión es lenta. Esto puede afectar el rendimiento.",
            variant: "default",
          });
        }
        
        return newNetworkInfo;
      });
    };

    // Initial check
    updateNetworkInfo();

    // Listen for online/offline events
    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    // Listen for connection changes (if supported)
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, [toast]);

  return networkInfo;
}