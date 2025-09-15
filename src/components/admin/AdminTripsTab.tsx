import LastMileTab from "./LastMileTab";

interface AdminTripsTabProps {
  trips: any[];
  onViewTripDetail: (trip: any) => void;
  onApproveReject: (type: 'package' | 'trip', id: string, action: 'approve' | 'reject') => void;
  getStatusBadge: (status: string) => JSX.Element;
}

const AdminTripsTab = ({ 
  trips, 
  onViewTripDetail, 
  onApproveReject, 
  getStatusBadge 
}: AdminTripsTabProps) => {
  return (
    <div className="space-y-4">
      <LastMileTab 
        trips={trips}
        getStatusBadge={getStatusBadge}
      />
    </div>
  );
};

export default AdminTripsTab;