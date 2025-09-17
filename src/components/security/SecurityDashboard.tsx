// Security monitoring dashboard for administrators
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SecurityMonitor } from '@/lib/securityMonitoring';
import { getSessionInfo } from '@/lib/sessionSecurity';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, Eye, Clock, Activity } from 'lucide-react';

interface SecurityStats {
  totalEvents: number;
  authFailures: number;
  suspiciousActivities: number;
  lastEvent?: any;
}

interface RecentSecurityEvent {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'warn' | 'error';
  timestamp: string;
  context?: any;
}

export default function SecurityDashboard() {
  const [securityStats, setSecurityStats] = useState<SecurityStats>({
    totalEvents: 0,
    authFailures: 0,
    suspiciousActivities: 0
  });
  const [recentEvents, setRecentEvents] = useState<RecentSecurityEvent[]>([]);
  const [sessionInfo, setSessionInfo] = useState(getSessionInfo());

  useEffect(() => {
    // Load initial security statistics
    const stats = SecurityMonitor.getSecurityStats();
    setSecurityStats(stats);

    // Set up session info updates
    const sessionInterval = setInterval(() => {
      setSessionInfo(getSessionInfo());
    }, 60000); // Update every minute

    // Load recent security events from database
    loadRecentSecurityEvents();

    return () => {
      clearInterval(sessionInterval);
    };
  }, []);

  const loadRecentSecurityEvents = async () => {
    try {
      const { data: events, error } = await supabase
        .from('client_errors')
        .select('*')
        .in('type', ['security_audit', 'auth_failure', 'suspicious_activity'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedEvents: RecentSecurityEvent[] = events?.map(event => ({
        id: event.id,
        type: event.type || 'unknown',
        message: event.message || 'No message',
        severity: event.severity === 'error' ? 'error' : 
                 event.type === 'suspicious_activity' ? 'warn' : 'info',
        timestamp: event.created_at,
        context: event.context
      })) || [];

      setRecentEvents(formattedEvents);
    } catch (error) {
      console.error('Failed to load security events:', error);
    }
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Security Dashboard</h2>
      </div>

      {/* Security Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{securityStats.totalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Auth Failures</p>
                <p className="text-2xl font-bold">{securityStats.authFailures}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-secondary" />
              <div>
                <p className="text-sm text-muted-foreground">Suspicious Activities</p>
                <p className="text-2xl font-bold">{securityStats.suspiciousActivities}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Session Remaining</p>
                <p className="text-lg font-bold">
                  {sessionInfo.isValid ? formatTime(sessionInfo.remainingIdleTime) : 'Expired'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Security Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Session Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Session Status:</span>
                <Badge variant={sessionInfo.isValid ? 'default' : 'destructive'}>
                  {sessionInfo.isValid ? 'Active' : 'Expired'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Idle Time Remaining:</span>
                <span className="text-sm font-medium">
                  {formatTime(sessionInfo.remainingIdleTime)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Session Time Remaining:</span>
                <span className="text-sm font-medium">
                  {formatTime(sessionInfo.remainingSessionTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Max Idle Time:</span>
                <span className="text-sm font-medium">30 minutes</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent security events
              </p>
            ) : (
              recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityColor(event.severity)}>
                        {event.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{event.message}</p>
                    {event.context && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer">
                          Show details
                        </summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                          {JSON.stringify(event.context, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}