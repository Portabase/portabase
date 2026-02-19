import {cn} from "@/lib/utils";
import {zodResolver} from "@hookform/resolvers/zod";
import type * as LabelPrimitive from "@radix-ui/react-label";
import {Slot} from "@radix-ui/react-slot";
import * as React from "react";
import type {
  ControllerProps,
  FieldPath,
  FieldValues,
  SubmitHandler,
  UseFormProps,
  UseFormReturn,
} from "react-hook-form";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";
import type {TypeOf, ZodSchema} from "zod";
import {Label} from "./label";

type FormProps<T extends FieldValues> = Omit<
    React.ComponentProps<"form">,
    "onSubmit"
> & {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  disabled?: boolean;
};

const Form = <T extends FieldValues>({
                                       form,
                                       onSubmit,
                                       children,
                                       className,
                                       disabled,
                                       ...props
                                     }: FormProps<T>) => (
    <FormProvider {...form}>
      <form
          onSubmit={form.handleSubmit(onSubmit)}
          {...props}
          className={className}
      >
        <fieldset
            disabled={disabled || form.formState.isSubmitting}
            className={className}
        >
          {children}
        </fieldset>
      </form>
    </FormProvider>
);

type FormFieldContextValue<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
    {} as FormFieldContextValue
);

const FormField = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
    ...props
  }: ControllerProps<TFieldValues, TName>) => {
  return (
      <FormFieldContext.Provider value={{name: props.name}}>
        <Controller {...props} />
      </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const {getFieldState, formState} = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext.name) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const {id} = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
    {} as FormItemContextValue
);

const FormItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({className, ...props}, ref) => {
  const id = React.useId();

  return (
      <FormItemContext.Provider value={{id}}>
        <div ref={ref} className={cn("space-y-2", className)} {...props} />
      </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
    React.ElementRef<typeof LabelPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({className, ...props}, ref) => {
  const {error, formItemId} = useFormField();

  return (
      <Label
          ref={ref}
          className={cn(error && "text-destructive", className)}
          htmlFor={formItemId}
          {...props}
      />
  );
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<
    React.ElementRef<typeof Slot>,
    React.ComponentPropsWithoutRef<typeof Slot>
>(({...props}, ref) => {
  const {error, formItemId, formDescriptionId, formMessageId} =
      useFormField();

  return (
      <Slot
          ref={ref}
          id={formItemId}
          aria-describedby={
            error ? `${formDescriptionId} ${formMessageId}` : `${formDescriptionId}`
          }
          aria-invalid={!!error}
          {...props}
      />
  );
});
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({className, ...props}, ref) => {
  const {formDescriptionId} = useFormField();

  return (
      <p
          ref={ref}
          id={formDescriptionId}
          className={cn("text-sm text-muted-foreground", className)}
          {...props}
      />
  );
});
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({className, children, ...props}, ref) => {
  const {error, formMessageId} = useFormField();
  const body = error ? String(error.message) : children;

  if (!body) {
    return null;
  }

  return (
      <p
          ref={ref}
          id={formMessageId}
          className={cn("text-sm font-medium text-destructive", className)}
          {...props}
      >
        {body}
      </p>
  );
});
FormMessage.displayName = "FormMessage";

type UseZodFormProps<Z extends ZodSchema> = Exclude<
    UseFormProps<TypeOf<Z>>,
    "resolver"
> & {
  schema: Z;
};


const useZodForm = <Z extends ZodSchema>({
                                           schema,
                                           ...formProps
                                         }: UseZodFormProps<Z>) =>
    useForm({
      ...formProps,
        // @ts-ignore
      resolver: zodResolver(schema),
    });

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
  useZodForm,
};