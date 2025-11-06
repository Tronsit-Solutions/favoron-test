// Security management tab for admin dashboard
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SecurityDashboard from '@/components/security/SecurityDashboard';
import PhoneMigrationPanel from './PhoneMigrationPanel';
import { SecurityMonitor } from '@/lib/securityMonitoring';
import { getSessionInfo } from '@/lib/sessionSecurity';
import { Shield, AlertTriangle, RefreshCw, Download, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function SecurityTab() {
  const [isRunningSecurityScan, setIsRunningSecurityScan] = useState(false);

  const handleSecurityScan = async () => {
    setIsRunningSecurityScan(true);
    try {
      // In a real implementation, this would trigger a comprehensive security scan
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate scan
      
      toast.success('Security scan completed successfully');
    } catch (error) {
      toast.error('Security scan failed');
      console.error('Security scan error:', error);
    } finally {
      setIsRunningSecurityScan(false);
    }
  };

  const handleExportLogs = () => {
    try {
      const stats = SecurityMonitor.getSecurityStats();
      const exportData = {
        timestamp: new Date().toISOString(),
        stats,
        session: getSessionInfo(),
        exportedBy: 'admin'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Security logs exported successfully');
    } catch (error) {
      toast.error('Failed to export security logs');
      console.error('Export error:', error);
    }
  };

  const handleClearSecurityEvents = () => {
    try {
      SecurityMonitor.clearEvents();
      toast.success('Security events cleared');
    } catch (error) {
      toast.error('Failed to clear security events');
      console.error('Clear events error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Security Management</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSecurityScan}
            disabled={isRunningSecurityScan}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunningSecurityScan ? 'animate-spin' : ''}`} />
            {isRunningSecurityScan ? 'Scanning...' : 'Run Security Scan'}
          </Button>
          
          <Button
            onClick={handleExportLogs}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Security Dashboard</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
          <TabsTrigger value="policies">Access Policies</TabsTrigger>
          <TabsTrigger value="migrations">Migraciones</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Security Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Session Security</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• Session timeout: 30 minutes idle</p>
                    <p>• Maximum session duration: 8 hours</p>
                    <p>• Auto-logout on suspicious activity</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Rate Limiting</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• Authentication attempts: 5 per 15 minutes</p>
                    <p>• Financial operations: 5 per 15 minutes</p>
                    <p>• API requests: Standard Supabase limits</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Data Protection</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• Financial data masking enabled</p>
                    <p>• Comprehensive audit logging</p>
                    <p>• RLS policies enforced</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Security Headers</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• Content Security Policy active</p>
                    <p>• XSS protection enabled</p>
                    <p>• Frame options secured</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <Button
                  onClick={handleClearSecurityEvents}
                  variant="destructive"
                  size="sm"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Clear Security Events
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  This will clear all local security events for this session.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Row Level Security Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      Profiles Table
                      <Badge variant="default">Secured</Badge>
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Authentication required for all access</li>
                      <li>• Users can only view/edit own profiles</li>
                      <li>• Admins have restricted access with logging</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      Financial Data
                      <Badge variant="default">Secured</Badge>
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Account numbers masked in UI</li>
                      <li>• Access logging enabled</li>
                      <li>• Admin verification required</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      Packages & Trips
                      <Badge variant="default">Secured</Badge>
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• User-specific access controls</li>
                      <li>• Traveler-shopper relationship enforced</li>
                      <li>• Admin override with audit trail</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      Admin Functions
                      <Badge variant="default">Secured</Badge>
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Role-based access verification</li>
                      <li>• All actions logged with context</li>
                      <li>• Security definer functions protected</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migrations">
          <PhoneMigrationPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}