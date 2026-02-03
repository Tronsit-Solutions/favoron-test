import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAcquisitionSurveyResponses, AcquisitionSurveyResponse } from "@/hooks/useAcquisitionSurveyResponses";
import { formatDate } from "@/lib/formatters";
import { Users, ChevronDown, Loader2 } from "lucide-react";

const CHANNEL_CONFIG: Record<string, { label: string; color: string }> = {
  tiktok: { label: "TikTok", color: "bg-pink-500/20 text-pink-700 border-pink-300" },
  instagram_facebook_ads: { label: "Meta (Instagram/Facebook)", color: "bg-blue-500/20 text-blue-700 border-blue-300" },
  reels: { label: "Reels", color: "bg-purple-500/20 text-purple-700 border-purple-300" },
  friend_referral: { label: "Referidos", color: "bg-green-500/20 text-green-700 border-green-300" },
  other: { label: "Otro", color: "bg-gray-500/20 text-gray-700 border-gray-300" },
};

const getChannelDisplay = (source: string | null) => {
  if (!source) return { label: "Sin respuesta", color: "bg-muted text-muted-foreground" };
  return CHANNEL_CONFIG[source] || { label: source, color: "bg-muted text-muted-foreground" };
};

const formatUserName = (firstName: string | null, lastName: string | null): string => {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Usuario";
};

export const AcquisitionSurveyTable = () => {
  const [limit, setLimit] = useState(50);
  const { responses, isLoading } = useAcquisitionSurveyResponses(limit);

  const handleLoadMore = () => {
    setLimit(prev => prev + 50);
  };

  if (isLoading && responses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Respuestas Individuales
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Respuestas Individuales
          <Badge variant="secondary" className="ml-2">
            {responses.length} usuarios
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {responses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay respuestas de encuesta registradas
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Referidor</TableHead>
                    <TableHead>Fecha Respuesta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response) => {
                    const channelDisplay = getChannelDisplay(response.acquisitionSource);
                    const showReferrer = response.acquisitionSource === 'friend_referral';
                    
                    return (
                      <TableRow key={response.id}>
                        <TableCell className="font-medium">
                          {formatUserName(response.firstName, response.lastName)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {response.email || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={channelDisplay.color}
                          >
                            {channelDisplay.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {showReferrer && response.referrerName 
                            ? response.referrerName 
                            : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {response.answeredAt 
                            ? formatDate(response.answeredAt) 
                            : response.createdAt 
                              ? formatDate(response.createdAt)
                              : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {responses.length >= limit && (
              <div className="flex justify-center mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  )}
                  Ver más
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
