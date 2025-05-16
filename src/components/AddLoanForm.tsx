
import { useState, useEffect } from "react";
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
import { Tool, Loan, Employee } from "@/types/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Search, AlertTriangle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, set, addHours } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";

interface AddLoanFormProps {
  tools: Tool[];
  employees: Employee[];
  onAddLoan: (loan: Omit<Loan, "id" | "status">) => void;
}

const formSchema = z.object({
  toolId: z.string({
    required_error: "Selecione uma ferramenta.",
  }),
  isThirdParty: z.boolean().default(false),
  employeeId: z.string().optional(),
  borrower: z.string().optional(),
  role: z.string().optional(),
  borrowDate: z.date({
    required_error: "Selecione a data de saída.",
  }),
  expectedReturnDate: z.date().optional(),
}).refine(
  (data) => data.isThirdParty ? !!data.borrower : true,
  {
    message: "Nome da empresa/pessoa é obrigatório para terceiros.",
    path: ["borrower"],
  }
).refine(
  (data) => data.isThirdParty ? data.expectedReturnDate !== undefined : true,
  {
    message: "Data prevista de devolução é obrigatória para terceiros.",
    path: ["expectedReturnDate"],
  }
).refine(
  (data) => !data.isThirdParty ? !!data.employeeId : true,
  {
    message: "Selecione um funcionário.",
    path: ["employeeId"],
  }
);

const AddLoanForm = ({ tools, employees, onAddLoan }: AddLoanFormProps) => {
  const availableTools = tools.filter((tool) => tool.available > 0);
  const [toolSearchQuery, setToolSearchQuery] = useState("");
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [openToolSelector, setOpenToolSelector] = useState(false);
  const [openEmployeeSelector, setOpenEmployeeSelector] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isThirdParty: false,
      borrowDate: new Date(),
      expectedReturnDate: undefined,
    },
  });

  // Extract form values for conditional rendering
  const isThirdParty = form.watch("isThirdParty");
  const selectedToolId = form.watch("toolId");
  const selectedEmployeeId = form.watch("employeeId");
  const borrowDate = form.watch("borrowDate");

  // Filter tools based on search query
  const filteredTools = availableTools.filter(tool => 
    tool.name.toLowerCase().includes(toolSearchQuery.toLowerCase())
  );

  // Filter unavailable tools for display
  const unavailableFilteredTools = tools
    .filter(tool => tool.available === 0)
    .filter(tool => tool.name.toLowerCase().includes(toolSearchQuery.toLowerCase()));

  // Filter employees based on search query
  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
    employee.role.toLowerCase().includes(employeeSearchQuery.toLowerCase())
  );

  // Update borrower and role when an employee is selected
  useEffect(() => {
    if (selectedEmployeeId && !isThirdParty) {
      const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
      if (selectedEmployee) {
        form.setValue("borrower", selectedEmployee.name);
        form.setValue("role", selectedEmployee.role);
      }
    }
  }, [selectedEmployeeId, isThirdParty, employees, form]);

  // Reset employee-related fields when switching between employee/third-party
  useEffect(() => {
    if (isThirdParty) {
      form.setValue("employeeId", undefined);
    } else {
      form.setValue("borrower", "");
      form.setValue("role", "");
      form.setValue("expectedReturnDate", undefined);
    }
  }, [isThirdParty, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Find the selected tool
    const selectedTool = tools.find((tool) => tool.id === values.toolId);
    if (!selectedTool) return;

    try {
      // Prepare loan data
      const loanData: Omit<Loan, "id" | "status"> = {
        toolId: values.toolId,
        toolName: selectedTool.name,
        borrower: isThirdParty ? values.borrower! : employees.find(e => e.id === values.employeeId)?.name || "",
        role: isThirdParty ? "" : employees.find(e => e.id === values.employeeId)?.role || "",
        isThirdParty: values.isThirdParty,
        borrowDate: values.borrowDate,
        expectedReturnDate: isThirdParty ? values.expectedReturnDate || null : null,
        returnDate: null,
        employeeId: isThirdParty ? null : values.employeeId || null
      };

      // Add loan
      onAddLoan(loanData);
      form.reset();
      setToolSearchQuery("");
      setEmployeeSearchQuery("");
    } catch (error) {
      console.error("Error submitting loan:", error);
      toast.error("Erro ao registrar empréstimo");
    }
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
                      value={toolSearchQuery}
                      onValueChange={setToolSearchQuery}
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Nenhuma ferramenta encontrada
                        </div>
                      </CommandEmpty>
                      <CommandGroup heading="Ferramentas disponíveis">
                        {filteredTools.map((tool) => (
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
                        ))}
                      </CommandGroup>
                      {unavailableFilteredTools.length > 0 && (
                        <>
                          <CommandSeparator />
                          <CommandGroup heading="Ferramentas indisponíveis">
                            {unavailableFilteredTools.map((tool) => (
                              <CommandItem
                                key={tool.id}
                                value={`unavailable-${tool.id}`}
                                disabled
                                className="opacity-50"
                              >
                                {tool.name}
                                <span className="ml-2 text-xs text-destructive font-medium">
                                  (Indisponível)
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
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

        {isThirdParty ? (
          <FormField
            control={form.control}
            name="borrower"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Empresa/Pessoa</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: ABC Construções"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Funcionário</FormLabel>
                <Popover open={openEmployeeSelector} onOpenChange={setOpenEmployeeSelector}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openEmployeeSelector}
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? employees.find((employee) => employee.id === field.value)?.name
                          : "Selecione um funcionário"}
                        <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Buscar funcionário..."
                        value={employeeSearchQuery}
                        onValueChange={setEmployeeSearchQuery}
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Nenhum funcionário encontrado
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredEmployees.map((employee) => (
                            <CommandItem
                              key={employee.id}
                              value={employee.id}
                              onSelect={() => {
                                form.setValue("employeeId", employee.id);
                                setOpenEmployeeSelector(false);
                              }}
                            >
                              {employee.name}
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({employee.role})
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                {!isThirdParty && (
                  "Para funcionários, o prazo de devolução é até as 18:00 do mesmo dia."
                )}
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
                  Data limite para devolução da ferramenta.
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
