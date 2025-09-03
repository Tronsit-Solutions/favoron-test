import React from "react";
import { Package } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FinancialSummaryTable from "./FinancialSummaryTable";
import FinancialSummaryByTraveler from "./FinancialSummaryByTraveler";

interface FinancialTablesSectionProps {
  packages: Package[];
}

const FinancialTablesSection = ({ packages }: FinancialTablesSectionProps) => {
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="general">Resumen General</TabsTrigger>
        <TabsTrigger value="travelers">Por Viajero</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general" className="mt-6">
        <FinancialSummaryTable packages={packages} />
      </TabsContent>
      
      <TabsContent value="travelers" className="mt-6">
        <FinancialSummaryByTraveler packages={packages} />
      </TabsContent>
    </Tabs>
  );
};

export default FinancialTablesSection;