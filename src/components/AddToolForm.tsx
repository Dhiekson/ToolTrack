
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Tool, ToolCategory } from "@/types/types";

interface AddToolFormProps {
  onAddTool: (tool: Omit<Tool, "id">) => void;
}

const formSchema = z.object({
  name: z
    .string()
    .min(3, {
      message: "Nome deve ter pelo menos 3 caracteres.",
    })
    .max(50, {
      message: "Nome não pode ter mais de 50 caracteres.",
    }),
  category: z.nativeEnum(ToolCategory, {
    errorMap: () => ({ message: "Selecione uma categoria válida." }),
  }),
  quantity: z
    .number()
    .min(1, {
      message: "Quantidade deve ser pelo menos 1.",
    })
    .max(1000, {
      message: "Quantidade não pode ser maior que 1000.",
    }),
});

const AddToolForm = ({ onAddTool }: AddToolFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: undefined,
      quantity: 1,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onAddTool({
      name: values.name,
      category: values.category,
      quantity: values.quantity,
      available: values.quantity,
    });

    toast.success("Ferramenta adicionada com sucesso");
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Ferramenta</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Furadeira Elétrica" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={ToolCategory.ELECTRIC}>Elétrica</SelectItem>
                  <SelectItem value={ToolCategory.MANUAL}>Manual</SelectItem>
                  <SelectItem value={ToolCategory.DIAGNOSTIC}>Diagnóstico</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Adicionar Ferramenta
        </Button>
      </form>
    </Form>
  );
};

export default AddToolForm;
