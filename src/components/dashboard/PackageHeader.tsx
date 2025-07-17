import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PackageHeaderProps {
  pkg: any;
  getStatusBadge: (status: string, packageDestination?: string) => JSX.Element;
}

const PackageHeader = ({ pkg, getStatusBadge }: PackageHeaderProps) => {
  const getTitle = () => {
    if (pkg.products && pkg.products.length > 0) {
      return `${pkg.products.length} producto${pkg.products.length > 1 ? 's' : ''}: ${pkg.products[0].itemDescription}${pkg.products.length > 1 ? ' y más...' : ''}`;
    }
    return pkg.itemDescription;
  };

  const getDescription = () => {
    if (pkg.products && pkg.products.length > 0) {
      const total = pkg.products.reduce((sum: number, p: any) => sum + parseFloat(p.estimatedPrice || 0), 0);
      return `Total estimado: $${total.toFixed(2)} • Fecha límite: ${new Date(pkg.deliveryDeadline).toLocaleDateString('es-GT')}`;
    }
    return `Precio estimado: ${pkg.estimatedPrice} • Fecha límite: ${new Date(pkg.deliveryDeadline).toLocaleDateString('es-GT')}`;
  };

  return (
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <CardTitle className="text-lg mb-2">
            {getTitle()}
          </CardTitle>
          <CardDescription>
            {getDescription()}
          </CardDescription>
        </div>
        <div className="ml-4">
          {getStatusBadge(pkg.status, pkg.package_destination)}
        </div>
      </div>
    </CardHeader>
  );
};

export default PackageHeader;