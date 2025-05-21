
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { LoanWithToolData } from "@/types/types";

// Schema for print dialog form
const printFormSchema = z.object({
  borrowerType: z.enum(["all", "employee"], {
    required_error: "Selecione o tipo de responsável",
  }),
  employeeName: z.string().optional(),
  companyName: z.string().optional(),
  loanStatus: z.enum(["all", "active", "returned"], {
    required_error: "Selecione o status dos empréstimos",
  }),
  printerType: z.enum(["receipt", "normal"], {
    required_error: "Selecione o tipo de impressora",
  })
}).refine(data => {
  // If borrowerType is employee, employeeName must be set
  if (data.borrowerType === "employee" && !data.employeeName) {
    return false;
  }
  return true;
}, {
  message: "Selecione um responsável",
  path: ["employeeName"]
});

type PrintFormValues = z.infer<typeof printFormSchema>;

interface PrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loans: LoanWithToolData[];
  uniqueEmployeeBorrowers: string[];
}

export function PrintDialog({ open, onOpenChange, loans, uniqueEmployeeBorrowers }: PrintDialogProps) {
  const [showEmployeeNotFound, setShowEmployeeNotFound] = useState(false);
  const [employeeSearchValue, setEmployeeSearchValue] = useState("");
  
  // Form for print dialog
  const printForm = useForm<PrintFormValues>({
    resolver: zodResolver(printFormSchema),
    defaultValues: {
      borrowerType: "all",
      employeeName: "",
      companyName: "",
      loanStatus: "all",
      printerType: "receipt"
    }
  });

  // Watch borrowerType to update the form fields
  const borrowerType = printForm.watch("borrowerType");
  
  // Função para verificar se um funcionário existe
  const checkEmployeeExists = (name: string) => {
    if (!name || name === "all") return true;
    
    return uniqueEmployeeBorrowers.some(
      borrower => borrower.toLowerCase().includes(name.toLowerCase())
    );
  };

  // Função para filtrar funcionários com base na busca
  const filterEmployees = (searchValue: string) => {
    if (!searchValue) return uniqueEmployeeBorrowers;
    
    return uniqueEmployeeBorrowers.filter(
      name => name.toLowerCase().includes(searchValue.toLowerCase())
    );
  };
  
  // Função para imprimir com opções personalizadas
  const handlePrintWithOptions = (values: PrintFormValues) => {
    try {
      // Verificar se o funcionário existe na lista
      if (values.borrowerType === "employee" && values.employeeName && !checkEmployeeExists(values.employeeName)) {
        toast.error("Funcionário não encontrado na lista.");
        setShowEmployeeNotFound(true);
        return;
      }

      // Aplicar filtros baseados nos valores do formulário
      const employeeFilterValue = values.borrowerType === "employee" ? values.employeeName || "all" : "all";
      const statusFilterValue = values.loanStatus;
      const isPrinterReceipt = values.printerType === "receipt";
      const borrowerTypeValue = values.borrowerType;
      
      // Configurar estilo de impressão
      const originalTitle = document.title;
      document.title = `Relatório - ${new Date().toLocaleDateString()}`;
      
      // Adicionar estilos para impressão
      const style = document.createElement('style');
      
      if (isPrinterReceipt) {
        // Estilo para impressora de cupom
        style.innerHTML = `
          @media print {
            body * {
              visibility: hidden;
              margin: 0;
              padding: 0;
            }
            .print-container, .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm; /* Largura padrão para impressora de cupom */
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }
            th, td {
              padding: 3px;
              border-bottom: 1px dashed #ddd;
            }
            .print-header {
              text-align: center;
              margin-bottom: 10px;
              border-bottom: 1px dashed black;
              padding-bottom: 8px;
            }
            .print-title {
              font-size: 14px;
              font-weight: bold;
              margin: 0;
            }
            .print-subtitle {
              font-size: 10px;
              margin: 4px 0;
            }
            .print-info {
              font-size: 9px;
              margin: 2px 0;
            }
          }
        `;
      } else {
        // Estilo para impressora normal
        style.innerHTML = `
          @media print {
            body * {
              visibility: hidden;
            }
            .print-container, .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              padding: 8px;
              border-bottom: 1px solid #ddd;
            }
            .print-header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid black;
            }
            .print-title {
              font-size: 18px;
              font-weight: bold;
              margin: 0;
            }
            .print-subtitle {
              font-size: 14px;
              margin: 8px 0;
            }
            .print-info {
              font-size: 12px;
              margin: 4px 0;
            }
          }
        `;
      }
      
      document.head.appendChild(style);
      
      // Filtrar os empréstimos conforme as opções selecionadas
      const printLoans = loans.filter(loan => {
        // Filtro por tipo de responsável
        if (borrowerTypeValue === "employee" && loan.isThirdParty) return false;
        
        // Filtro por funcionário específico
        if (borrowerTypeValue === "employee" && employeeFilterValue !== "all") {
          if (loan.borrower.toLowerCase() !== employeeFilterValue.toLowerCase()) return false;
        }
        
        // Filtro por status
        if (statusFilterValue === "active") return loan.status === "active";
        if (statusFilterValue === "returned") return loan.status === "returned";
        
        return true;
      }).sort((a, b) => a.toolName.localeCompare(b.toolName, 'pt-BR'));
      
      // Criar contêiner temporário para impressão
      const printContainer = document.createElement('div');
      printContainer.classList.add('print-container');
      
      // Adicionar cabeçalho
      const header = document.createElement('div');
      header.classList.add('print-header');
      
      const title = document.createElement('p');
      title.classList.add('print-title');
      title.textContent = 'Relatório de Empréstimos';
      header.appendChild(title);
      
      const subtitle = document.createElement('p');
      subtitle.classList.add('print-subtitle');
      subtitle.textContent = format(new Date(), "dd/MM/yyyy HH:mm");
      header.appendChild(subtitle);
      
      // Adicionar informações de filtro
      if (employeeFilterValue !== "all") {
        const empInfo = document.createElement('p');
        empInfo.classList.add('print-info');
        empInfo.textContent = `Funcionário: ${employeeFilterValue}`;
        header.appendChild(empInfo);
      }
      
      const statusInfo = document.createElement('p');
      statusInfo.classList.add('print-info');
      statusInfo.textContent = `Status: ${
        statusFilterValue === "active" ? "Em uso" : 
        statusFilterValue === "returned" ? "Devolvidos" : "Todos"
      }`;
      header.appendChild(statusInfo);
      
      const borrowerTypeInfo = document.createElement('p');
      borrowerTypeInfo.classList.add('print-info');
      borrowerTypeInfo.textContent = `Tipo: ${
        borrowerTypeValue === "employee" ? "Funcionários" : "Todos"
      }`;
      header.appendChild(borrowerTypeInfo);
      
      const printerInfo = document.createElement('p');
      printerInfo.classList.add('print-info');
      printerInfo.textContent = `Impressora: ${isPrinterReceipt ? "Cupom" : "Normal"}`;
      header.appendChild(printerInfo);
      
      printContainer.appendChild(header);
      
      // Criar tabela para impressão
      const table = document.createElement('table');
      table.innerHTML = `
        <thead>
          <tr>
            <th>Ferramenta</th>
            <th>Responsável</th>
            <th>Saída</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${printLoans.length > 0 ? printLoans.map(loan => `
            <tr>
              <td>${loan.toolName}</td>
              <td>${loan.borrower}</td>
              <td>${formatDate(loan.borrowDate, false)}</td>
              <td>${loan.status === "active" ? "Em uso" : "Devolvido"}</td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="4" style="text-align: center; padding: 20px;">Nenhum registro encontrado</td>
            </tr>
          `}
        </tbody>
      `;
      
      printContainer.appendChild(table);
      document.body.appendChild(printContainer);
      
      // Imprimir e limpar
      window.print();
      
      document.body.removeChild(printContainer);
      document.head.removeChild(style);
      document.title = originalTitle;
      
      // Fechar o diálogo após imprimir
      onOpenChange(false);
      printForm.reset();
      
      toast.success("Comando de impressão enviado");
    } catch (error) {
      console.error("Erro ao imprimir:", error);
      toast.error("Erro ao imprimir. Verifique o console para mais detalhes.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Opções de Impressão</DialogTitle>
          <DialogDescription>
            Selecione os filtros para o relatório que deseja imprimir
          </DialogDescription>
        </DialogHeader>
        
        <Form {...printForm}>
          <form onSubmit={printForm.handleSubmit(handlePrintWithOptions)} className="space-y-4">
            <FormField
              control={printForm.control}
              name="borrowerType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Responsável</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="borrower-all" />
                        <Label htmlFor="borrower-all">Todos</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="employee" id="borrower-employee" />
                        <Label htmlFor="borrower-employee">Funcionários</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Campo condicional para seleção de funcionário */}
            {borrowerType === "employee" && (
              <FormField
                control={printForm.control}
                name="employeeName"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Nome do Funcionário</FormLabel>
                    <div className="relative">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? field.value === "all" 
                                  ? "Todos os funcionários" 
                                  : field.value
                                : "Selecione um funcionário"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Buscar funcionário..." 
                              onValueChange={setEmployeeSearchValue}
                            />
                            <CommandEmpty>Nenhum funcionário encontrado.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                key="all-employees"
                                value="all"
                                onSelect={() => {
                                  printForm.setValue("employeeName", "all");
                                  setEmployeeSearchValue("");
                                  setShowEmployeeNotFound(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === "all" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                Todos os funcionários
                              </CommandItem>
                              {filterEmployees(employeeSearchValue).map((name) => (
                                <CommandItem
                                  key={name}
                                  value={name}
                                  onSelect={() => {
                                    printForm.setValue("employeeName", name);
                                    setEmployeeSearchValue("");
                                    setShowEmployeeNotFound(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      name === field.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {showEmployeeNotFound && borrowerType === "employee" && (
                      <p className="text-sm font-medium text-destructive">
                        Funcionário não encontrado na lista.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={printForm.control}
              name="loanStatus"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Status dos Empréstimos</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all">Todos</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="active" id="active" />
                        <Label htmlFor="active">Em uso</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="returned" id="returned" />
                        <Label htmlFor="returned">Devolvidos</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={printForm.control}
              name="printerType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Impressora</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="receipt" id="receipt" />
                        <Label htmlFor="receipt">Impressora de Cupom</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="normal" id="normal" />
                        <Label htmlFor="normal">Impressora Normal</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Imprimir</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
