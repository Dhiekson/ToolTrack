
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Search, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, set } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { addHours } from "date-fns";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";

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
  expectedReturnDate: z.date().optional(),
}).refine(
  (data) => !(!data.isThirdParty && !data.role),
  {
    message: "Função é obrigatória para funcionários internos.",
    path: ["role"],
  }
).refine(
  (data) => !data.isThirdParty || data.expectedReturnDate,
  {
    message: "Data prevista de devolução é obrigatória para terceiros.",
    path: ["expectedReturnDate"],
  }
);

const AddLoanForm = ({ tools, onAddLoan }: AddLoanFormProps) => {
  const availableTools = tools.filter((tool) => tool.available > 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [openToolSelector, setOpenToolSelector] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isThirdParty: false,
      borrowDate: new Date(),
      expectedReturnDate: undefined,
    },
  });

  // Extrair valor atual de isThirdParty para condicionalmente renderizar campos
  const isThirdParty = form.watch("isThirdParty");
  const selectedToolId = form.watch("toolId");
  const borrowDate = form.watch("borrowDate");

  const filteredTools = availableTools.filter(tool => 
    tool.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Encontrar o nome da ferramenta selecionada
    const selectedTool = tools.find((tool) => tool.id === values.toolId);
    if (!selectedTool) return;

    // Usar a data e hora atual para o empréstimo
    const borrowDateWithTime = new Date();

    // Para terceiros, usar a data prevista de devolução com a hora atual
    let expectedReturnDateWithTime: Date | null = null;
    if (values.isThirdParty && values.expectedReturnDate) {
      const now = new Date();
      expectedReturnDateWithTime = set(new Date(values.expectedReturnDate), {
        hours: now.getHours(),
        minutes: now.getMinutes(),
        seconds: now.getSeconds(),
      });
    } else {
      // Para funcionários, não definimos data de devolução prevista
      expectedReturnDateWithTime = null;
    }

    onAddLoan({
      toolId: values.toolId,
      toolName: selectedTool.name,
      borrower: values.borrower,
      role: values.isThirdParty ? "" : values.role || "",
      isThirdParty: values.isThirdParty,
      borrowDate: borrowDateWithTime,
      expectedReturnDate: expectedReturnDateWithTime || addHours(borrowDateWithTime, 8), // Fallback
      returnDate: null,
    });

    toast.success("Empréstimo registrado com sucesso");
    form.reset();
    setSearchQuery("");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="toolId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Ferramenta</FormLabel>
              <Popover open={openToolSelector} onOpenChange={setOpenToolSelector}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openToolSelector}
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? tools.find((tool) => tool.id === field.value)?.name
                        : "Selecione uma ferramenta"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                      placeholder="Buscar ferramenta..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Nenhuma ferramenta encontrada
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredTools.length > 0 ? (
                          filteredTools.map((tool) => (
                            <CommandItem
                              key={tool.id}
                              value={tool.id}
                              onSelect={() => {
                                form.setValue("toolId", tool.id);
                                setOpenToolSelector(false);
                              }}
                            >
                              {tool.name}
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({tool.available} disponíveis)
                              </span>
                            </CommandItem>
                          ))
                        ) : (
                          tools
                            .filter(tool => tool.available === 0)
                            .filter(tool => tool.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((tool) => (
                              <CommandItem
                                key={tool.id}
                                value={tool.id}
                                disabled
                                className="opacity-50"
                              >
                                {tool.name}
                                <span className="ml-2 text-xs text-destructive font-medium">
                                  (Indisponível)
                                </span>
                              </CommandItem>
                            ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
              <FormDescription>
                O horário de saída será registrado automaticamente no momento do empréstimo.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {isThirdParty && (
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
                      disabled={(date) => date < borrowDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  O horário previsto de devolução será o mesmo da criação do registro.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full">
          Registrar Empréstimo
        </Button>
      </form>
    </Form>
  );
};

export default AddLoanForm;
