import React from "react";
import { Package } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FinancialSummaryTable from "./FinancialSummaryTable";
import FinancialSummaryByTraveler from "./FinancialSummaryByTraveler";
import CompletedPackagesTable from "./CompletedPackagesTable";
import CashFlowTable from "./CashFlowTable";

interface FinancialTablesSectionProps {
  packages: Package[];
}

const FinancialTablesSection = ({ packages }: FinancialTablesSectionProps) => {
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="general">Resumen General</TabsTrigger>
        <TabsTrigger value="travelers">Por Viajero</TabsTrigger>
        <TabsTrigger value="completed">Completados</TabsTrigger>
        <TabsTrigger value="cashflow">Flujo de Caja</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general" className="mt-6">
        <FinancialSummaryTable packages={packages} />
      </TabsContent>
      
      <TabsContent value="travelers" className="mt-6">
        <FinancialSummaryByTraveler packages={packages} />
      </TabsContent>
      
      <TabsContent value="completed" className="mt-6">
        <CompletedPackagesTable packages={packages} />
      </TabsContent>
      
      <TabsContent value="cashflow" className="mt-6">
        <CashFlowTable />
      </TabsContent>
    </Tabs>
  );
};

export default FinancialTablesSection;