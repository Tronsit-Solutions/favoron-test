import React from 'react';
import CollapsiblePackageCard from './dashboard/CollapsiblePackageCard';
import TripCard from './dashboard/TripCard';
import TripPackagesGroup from './dashboard/TripPackagesGroup';

// Memoized package card to prevent unnecessary re-renders
export const MemoizedPackageCard = React.memo(CollapsiblePackageCard, (prevProps, nextProps) => {
  return (
    prevProps.pkg.id === nextProps.pkg.id &&
    prevProps.pkg.status === nextProps.pkg.status &&
    prevProps.pkg.updated_at === nextProps.pkg.updated_at &&
    prevProps.viewMode === nextProps.viewMode
  );
});

// Memoized trip card to prevent unnecessary re-renders
export const MemoizedTripCard = React.memo(TripCard, (prevProps, nextProps) => {
  return (
    prevProps.trip.id === nextProps.trip.id &&
    prevProps.trip.status === nextProps.trip.status &&
    prevProps.trip.updated_at === nextProps.trip.updated_at
  );
});

// Memoized trip packages group
export const MemoizedTripPackagesGroup = React.memo(TripPackagesGroup, (prevProps, nextProps) => {
  return (
    prevProps.trip.id === nextProps.trip.id &&
    prevProps.packages.length === nextProps.packages.length &&
    prevProps.packages.every((pkg, index) => 
      pkg.id === nextProps.packages[index]?.id &&
      pkg.status === nextProps.packages[index]?.status
    )
  );
});