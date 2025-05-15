
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Tool, Loan } from "@/types/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";

interface AddLoanFormProps {
  tools: Tool[];
  onAddLoan: (loan: Omit<Loan, "id" | "status">) => void;
}

const formSchema = z.object({
  toolId: z.string({
    required_error: "Selecione uma ferramenta.",
  }),
  borrower: z
    .string()
    .min(3, {
      message: "Nome deve ter pelo menos 3 caracteres.",
    })
    .max(50, {
      message: "Nome não pode ter mais de 50 caracteres.",
    }),
  isThirdParty: z.boolean().default(false),
  role: z.string().optional(),
  borrowDate: z.date({
    required_error: "Selecione a data de saída.",
  }),
  expectedReturnDate: z.date({
    required_error: "Selecione a data prevista para devolução.",
  }),
}).refine(
  (data) => !(!data.isThirdParty && !data.role),
  {
    message: "Função é obrigatória para funcionários internos.",
    path: ["role"],
  }
);

const AddLoanForm = ({ tools, onAddLoan }: AddLoanFormProps) => {
  const availableTools = tools.filter((tool) => tool.available > 0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isThirdParty: false,
      borrowDate: new Date(),
      expectedReturnDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
    },
  });

  // Extrair valor atual de isThirdParty para condicionalmente renderizar campos
  const isThirdParty = form.watch("isThirdParty");
  const selectedToolId = form.watch("toolId");

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Encontrar o nome da ferramenta selecionada
    const selectedTool = tools.find((tool) => tool.id === values.toolId);
    if (!selectedTool) return;

    onAddLoan({
      toolId: values.toolId,
      toolName: selectedTool.name,
      borrower: values.borrower,
      role: values.isThirdParty ? "" : values.role || "",
      isThirdParty: values.isThirdParty,
      borrowDate: values.borrowDate,
      expectedReturnDate: values.expectedReturnDate,
      returnDate: null,
    });

    toast.success("Empréstimo registrado com sucesso");
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="toolId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ferramenta</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma ferramenta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableTools.length > 0 ? (
                    availableTools.map((tool) => (
                      <SelectItem key={tool.id} value={tool.id}>
                        {tool.name} ({tool.available} disponíveis)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      Não há ferramentas disponíveis
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isThirdParty"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Empréstimo para Terceiros</FormLabel>
                <FormDescription>
                  Ative esta opção se a ferramenta será emprestada para uma pessoa ou empresa externa.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="borrower"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isThirdParty ? "Nome da Empresa/Pessoa" : "Nome do Funcionário"}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    isThirdParty ? "Ex: ABC Construções" : "Ex: João Silva"
                  }
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isThirdParty && (
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Função</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Mecânico">Mecânico</SelectItem>
                    <SelectItem value="Eletricista">Eletricista</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="borrowDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Saída</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expectedReturnDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Prevista de Devolução</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full">
          Registrar Empréstimo
        </Button>
      </form>
    </Form>
  );
};

export default AddLoanForm;
