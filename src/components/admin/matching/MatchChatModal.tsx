import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { PackageTimeline } from "@/components/chat/PackageTimeline";
import { getStatusInfo } from "./MatchStatusBadge";

interface MatchChatModalProps {
  selectedPackage: any;
  trips: any[];
  onClose: () => void;
}

export const MatchChatModal = ({ selectedPackage, trips, onClose }: MatchChatModalProps) => {
  if (!selectedPackage) return null;

  const statusInfo = getStatusInfo(selectedPackage.status);

  return (
    <Dialog open={!!selectedPackage} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Chat del Match</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{selectedPackage.item_description}</p>
                <p className="text-xs text-muted-foreground">
                  Shopper: {selectedPackage.user_id} | 
                  {selectedPackage.matched_trip_id && (
                    <span> Viajero: {trips.find(t => t.id === selectedPackage.matched_trip_id)?.user_id}</span>
                  )}
                </p>
              </div>
              <Badge className={`text-xs ${statusInfo.color}`}>
                {statusInfo.icon} {statusInfo.label}
              </Badge>
            </div>
          </div>
          
          <div className="h-[500px] overflow-hidden">
            <PackageTimeline 
              pkg={selectedPackage} 
              className="h-full"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};