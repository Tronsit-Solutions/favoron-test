import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { WidgetDefinition } from "./GodModeDashboard";

interface GodModeWidgetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableWidgets: WidgetDefinition[];
  onAddWidget: (widgetId: string) => void;
}

const GodModeWidgetPicker = ({ open, onOpenChange, availableWidgets, onAddWidget }: GodModeWidgetPickerProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Widget</DialogTitle>
        </DialogHeader>
        {availableWidgets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Ya tienes todos los widgets activos
          </p>
        ) : (
          <div className="grid gap-2">
            {availableWidgets.map((widget) => (
              <Button
                key={widget.id}
                variant="outline"
                className="justify-start gap-3 h-auto py-3"
                onClick={() => {
                  onAddWidget(widget.id);
                  onOpenChange(false);
                }}
              >
                <widget.icon className="h-4 w-4 text-primary shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm">{widget.name}</div>
                  <div className="text-xs text-muted-foreground">{widget.description}</div>
                </div>
                <Plus className="h-4 w-4 ml-auto shrink-0 text-muted-foreground" />
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GodModeWidgetPicker;
