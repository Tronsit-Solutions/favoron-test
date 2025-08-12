import React, { forwardRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { REJECTION_REASONS } from "@/lib/constants";

const schema = z.object({
  rejection_reason: z.enum(["no_longer_want", "too_expensive", "wrong_delivery_time", "other"], {
    required_error: "Selecciona una razón",
  }),
  wants_requote: z.boolean().optional().default(false),
  additional_comments: z.string().optional().default(""),
}).refine(
  (v) => !(v.rejection_reason === "no_longer_want" && v.wants_requote),
  { message: "No puedes solicitar recotización si ya no quieres el paquete" }
);

export type QuoteRejectionFormValues = z.infer<typeof schema>;
export type QuoteActionsFormRef = { submit: () => QuoteRejectionFormValues | null };

interface QuoteActionsFormProps {
  initialValues?: Partial<QuoteRejectionFormValues>;
  onChange?: (values: QuoteRejectionFormValues, isValid: boolean) => void;
}

const QuoteActionsForm = forwardRef<QuoteActionsFormRef, QuoteActionsFormProps>(
  ({ initialValues, onChange }, ref) => {
    const {
      register,
      watch,
      setValue,
      handleSubmit,
      formState: { isValid },
    } = useForm<QuoteRejectionFormValues>({
      resolver: zodResolver(schema),
      mode: "onChange",
      defaultValues: {
        rejection_reason: (initialValues?.rejection_reason as QuoteRejectionFormValues["rejection_reason"]) || undefined,
        wants_requote: initialValues?.wants_requote ?? false,
        additional_comments: initialValues?.additional_comments ?? "",
      },
    });

    const values = watch();

    // expose submit via ref
    React.useImperativeHandle(ref, () => ({
      submit: () => {
        let output: QuoteRejectionFormValues | null = null;
        handleSubmit((data) => {
          output = data;
        })();
        return output;
      },
    }));

    // If reason is no_longer_want, force wants_requote = false
    useEffect(() => {
      if (values.rejection_reason === "no_longer_want" && values.wants_requote) {
        setValue("wants_requote", false, { shouldValidate: true, shouldDirty: true });
      }
      onChange?.(values as QuoteRejectionFormValues, isValid);
    }, [values, isValid, onChange, setValue]);

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
        <div>
          <Label className="text-red-800 font-medium mb-3 block">
            ¿Por qué rechazas esta cotización? *
          </Label>
          <RadioGroup
            className="space-y-2"
            value={values.rejection_reason}
            onValueChange={(val) => setValue("rejection_reason", val as any, { shouldValidate: true })}
          >
            {Object.entries(REJECTION_REASONS).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <RadioGroupItem value={key} id={key} />
                <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {values.rejection_reason && values.rejection_reason !== "no_longer_want" && (
          <div className="border-t border-red-300 pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="wantsRequote" className="text-sm font-medium text-red-800">
                ¿Quieres solicitar una nueva cotización para este paquete?
              </Label>
              <Switch
                id="wantsRequote"
                checked={values.wants_requote}
                onCheckedChange={(checked) => setValue("wants_requote", !!checked, { shouldValidate: true })}
              />
            </div>
            <p className="text-xs text-red-600 mt-1">
              {values.wants_requote
                ? "El paquete volverá a estar disponible para que otros viajeros puedan enviar cotizaciones."
                : "El paquete será marcado como rechazado definitivamente."}
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="additionalComments" className="text-red-800 font-medium">
            Comentarios adicionales (opcional)
          </Label>
          <Textarea
            id="additionalComments"
            placeholder="Agrega cualquier comentario adicional..."
            {...register("additional_comments")}
            rows={2}
            className="mt-2"
          />
        </div>
      </div>
    );
  }
);

QuoteActionsForm.displayName = "QuoteActionsForm";

export default QuoteActionsForm;
