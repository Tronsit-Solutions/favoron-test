import { Package, TripDates } from "@/types";

interface ShopperPackageDetailsProps {
  pkg: Package;
}

const ShopperPackageDetails = ({ pkg }: ShopperPackageDetailsProps) => {
  const renderProducts = () => {
    // Single product display from Supabase schema
    return (
      <div className="space-y-3">
        <p className="text-sm">
          <strong>Descripción:</strong> {pkg.item_description}
        </p>
        {pkg.item_link && (
          <p className="text-sm">
            <strong>Link del producto:</strong>{' '}
            <a href={pkg.item_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Ver producto
            </a>
          </p>
        )}
        <p className="text-sm">
          <strong>Precio estimado:</strong> ${pkg.estimated_price}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {renderProducts()}
      
      {pkg.additional_notes && (
        <p className="text-sm">
          <strong>Notas adicionales:</strong> {pkg.additional_notes}
        </p>
      )}
      
      <p className="text-xs text-muted-foreground">
        Creado el {new Date(pkg.created_at).toLocaleDateString('es-GT')}
      </p>
    </div>
  );
};

export default ShopperPackageDetails;