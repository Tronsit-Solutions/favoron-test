import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFavoronCompanyInfo } from "@/hooks/useFavoronCompanyInfo";
import FavoronBankingInfoDisplay from "@/components/admin/FavoronBankingInfoDisplay";
import FavoronBankingInfoForm from "@/components/admin/FavoronBankingInfoForm";
import { useToast } from "@/hooks/use-toast";
import { Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const AdminFavoronBankingInfo = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const { companyInfo: favoronAccount, saveCompanyInfo: saveAccount, loading } = useFavoronCompanyInfo();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 md:pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center sm:gap-0">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información Bancaria de Favorón
            </CardTitle>
            <CardDescription className="text-sm">
              Gestiona la cuenta donde los shoppers realizan pagos
            </CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="self-start sm:self-center">
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {isEditing ? (
          <FavoronBankingInfoForm
            initialValues={{
              // Banking Information
              bank_name: favoronAccount?.bank_name || '',
              account_holder: favoronAccount?.account_holder || '',
              account_number: favoronAccount?.account_number || '',
              account_type: favoronAccount?.account_type || 'Monetaria',
              // Company Information
              company_name: favoronAccount?.company_name || 'Favorón',
              address_line_1: favoronAccount?.address_line_1 || '',
              address_line_2: favoronAccount?.address_line_2 || '',
              city: favoronAccount?.city || 'Guatemala',
              state_department: favoronAccount?.state_department || 'Guatemala',
              postal_code: favoronAccount?.postal_code || '',
              country: favoronAccount?.country || 'Guatemala',
              phone_number: favoronAccount?.phone_number || '',
              email: favoronAccount?.email || 'info@favoron.app',
              website: favoronAccount?.website || 'favoron.app',
              // Cancellation penalty
              cancellation_penalty_amount: favoronAccount?.cancellation_penalty_amount ?? 5,
            }}
            onSubmit={async (values) => {
              await saveAccount(values);
              toast({ title: 'Datos actualizados', description: 'La información de la empresa fue guardada.' });
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <FavoronBankingInfoDisplay companyInfo={favoronAccount} />
        )}
      </CardContent>
    </Card>
  );
};
