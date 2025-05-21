
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CalendarDays, Printer, Search, Filter, Building } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/DateRangePicker";
import { useTools } from "@/context/ToolsContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

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

const Reports = () => {
  const navigate = useNavigate();
  const { loans, employees } = useTools();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const [reportType, setReportType] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [openEmployeeSelect, setOpenEmployeeSelect] = useState(false);
  const [openCompanySelect, setOpenCompanySelect] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [employeeSearchValue, setEmployeeSearchValue] = useState("");
  const [companySearchValue, setCompanySearchValue] = useState("");
  const [showEmployeeNotFound, setShowEmployeeNotFound] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
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

  // Reset dependant fields when borrowerType changes
  useEffect(() => {
    if (borrowerType === "all") {
      printForm.setValue("employeeName", "");
      printForm.setValue("companyName", "");
    }
  }, [borrowerType, printForm]);

  // Ordenar funcionários por ordem alfabética
  const sortedEmployees = [...employees].sort((a, b) => 
    a.name.localeCompare(b.name, 'pt-BR')
  );
  
  // Obter nomes únicos dos funcionários para o filtro, ordenados alfabeticamente
  const uniqueBorrowers = Array.from(new Set(loans.map(loan => loan.borrower)))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Obter nomes únicos de empréstimos não terceiros para filtro
  const uniqueEmployeeBorrowers = Array.from(
    new Set(loans.filter(loan => !loan.isThirdParty).map(loan => loan.borrower))
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Obter empresas únicas dos empréstimos
  const uniqueCompanies = Array.from(
    new Set(loans
      .filter(loan => loan.borrower && loan.borrower.includes(" - "))
      .map(loan => {
        const parts = loan.borrower.split(" - ");
        return parts.length > 1 ? parts[1] : "";
      })
      .filter(company => company !== "")
    )
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Filtrar empréstimos com base na data, tipo, funcionário e empresa
  const filteredLoans = loans.filter(loan => {
    // Primeiro, aplicar filtro de funcionário
    const matchesEmployee = employeeFilter === "all" || 
      loan.borrower.toLowerCase().includes(employeeFilter.toLowerCase());
    
    if (!matchesEmployee) return false;
    
    // Aplicar filtro de empresa
    const matchesCompany = companyFilter === "all" || 
      (loan.borrower.includes(" - ") && loan.borrower.toLowerCase().includes(companyFilter.toLowerCase()));
    
    if (!matchesCompany) return false;
    
    // Em seguida, aplicar filtro de data
    if (date?.from && date?.to) {
      const loanDate = loan.status === "returned" ? loan.returnDate : loan.borrowDate;
      if (!loanDate) return false;
      
      const isWithinDateRange = loanDate >= date.from && loanDate <= date.to;
      if (!isWithinDateRange) return false;
    }
    
    // Por fim, aplicar filtro de status
    if (reportType === "all") return true;
    if (reportType === "active") return loan.status === "active";
    if (reportType === "returned") return loan.status === "returned";
    
    return true;
  })
  .sort((a, b) => a.toolName.localeCompare(b.toolName, 'pt-BR'));

  // Função para verificar se um funcionário existe
  const checkEmployeeExists = (name: string) => {
    if (!name || name === "all") return true;
    
    return uniqueEmployeeBorrowers.some(
      borrower => borrower.toLowerCase().includes(name.toLowerCase())
    );
  };

  // Função para verificar se uma empresa existe
  const checkCompanyExists = (name: string) => {
    if (!name || name === "all") return true;
    
    return uniqueCompanies.some(
      company => company.toLowerCase().includes(name.toLowerCase())
    );
  };

  // Função para filtrar funcionários com base na busca
  const filterEmployees = (searchValue: string) => {
    if (!searchValue) return uniqueEmployeeBorrowers;
    
    return uniqueEmployeeBorrowers.filter(
      name => name.toLowerCase().includes(searchValue.toLowerCase())
    );
  };

  // Função para filtrar empresas com base na busca
  const filterCompanies = (searchValue: string) => {
    if (!searchValue) return uniqueCompanies;
    
    return uniqueCompanies.filter(
      company => company.toLowerCase().includes(searchValue.toLowerCase())
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
      setDialogOpen(false);
      printForm.reset();
      
      toast.success("Comando de impressão enviado");
    } catch (error) {
      console.error("Erro ao imprimir:", error);
      toast.error("Erro ao imprimir. Verifique o console para mais detalhes.");
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-primary">
            Relatórios de Empréstimos
          </h1>
        </div>
      </div>

      {/* Filtros e conteúdo dos relatórios */}
      <Card className="mb-8 print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Relatório
          </CardTitle>
          <CardDescription>Selecione o período e tipo de relatório desejado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Período</label>
              <DateRangePicker 
                date={date}
                onDateChange={setDate}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Relatório</label>
              <Select
                value={reportType}
                onValueChange={setReportType}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os registros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os registros</SelectItem>
                  <SelectItem value="active">Empréstimos ativos</SelectItem>
                  <SelectItem value="returned">Empréstimos devolvidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Busca por Funcionário</label>
              <Popover 
                open={openEmployeeSelect} 
                onOpenChange={setOpenEmployeeSelect}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button" 
                    variant="outline"
                    role="combobox"
                    aria-expanded={openEmployeeSelect}
                    className="w-full justify-between"
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      setOpenEmployeeSelect(true);
                    }}
                  >
                    {employeeFilter === "all" ? "Todos os funcionários" : employeeFilter}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar funcionário..." 
                      value={employeeSearchValue}
                      onValueChange={setEmployeeSearchValue}
                    />
                    <CommandEmpty>Nenhum funcionário encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        key="all"
                        value="all"
                        onSelect={(value) => {
                          setEmployeeFilter("all");
                          setEmployeeSearchValue("");
                          setOpenEmployeeSelect(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            employeeFilter === "all" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Todos os funcionários
                      </CommandItem>
                      {filterEmployees(employeeSearchValue).map((name) => (
                        <CommandItem
                          key={name}
                          value={name}
                          onSelect={(value) => {
                            setEmployeeFilter(name);
                            setEmployeeSearchValue("");
                            setOpenEmployeeSelect(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              employeeFilter === name ? "opacity-100" : "opacity-0"
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
            
            <div>
              <label className="block text-sm font-medium mb-2">Busca por Empresa</label>
              <Popover 
                open={openCompanySelect} 
                onOpenChange={setOpenCompanySelect}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCompanySelect}
                    className="w-full justify-between"
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      setOpenCompanySelect(true);
                    }}
                  >
                    {companyFilter === "all" ? "Todas as empresas" : companyFilter}
                    <Building className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar empresa..." 
                      value={companySearchValue}
                      onValueChange={setCompanySearchValue}
                    />
                    <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        key="all-companies"
                        value="all"
                        onSelect={(value) => {
                          setCompanyFilter("all");
                          setCompanySearchValue("");
                          setOpenCompanySelect(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            companyFilter === "all" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Todas as empresas
                      </CommandItem>
                      {filterCompanies(companySearchValue).map((company) => (
                        <CommandItem
                          key={company}
                          value={company}
                          onSelect={(value) => {
                            setCompanyFilter(company);
                            setCompanySearchValue("");
                            setOpenCompanySelect(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              companyFilter === company ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {company}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mb-6 print:hidden">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex-grow md:flex-grow-0">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </DialogTrigger>
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
      </div>

      <Card ref={printRef}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Registro Histórico de Empréstimos
          </CardTitle>
          <CardDescription>
            {date?.from && date?.to
              ? `Relatório de ${formatDate(date.from)} até ${formatDate(date.to)}`
              : "Todos os registros"}
            {employeeFilter !== "all" && ` - Filtrado por: ${employeeFilter}`}
            {companyFilter !== "all" && ` - Empresa: ${companyFilter}`}
            {reportType !== "all" && ` - Status: ${reportType === "active" ? "Em uso" : "Devolvidos"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLoans.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ferramenta</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead>Devolução Prevista</TableHead>
                    <TableHead>Devolução Real</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>{loan.toolName}</TableCell>
                      <TableCell>
                        {loan.borrower}
                        {!loan.isThirdParty && loan.role && (
                          <div className="text-xs text-muted-foreground">
                            {loan.role}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(loan.borrowDate, true)}</TableCell>
                      <TableCell>
                        {loan.expectedReturnDate ? formatDate(loan.expectedReturnDate, true) : "-"}
                      </TableCell>
                      <TableCell>
                        {loan.returnDate ? formatDate(loan.returnDate, true) : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            loan.status === "active"
                              ? loan.expectedReturnDate && loan.expectedReturnDate < new Date()
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {loan.status === "active"
                            ? loan.expectedReturnDate && loan.expectedReturnDate < new Date()
                              ? "Atrasado"
                              : "Em uso"
                            : "Devolvido"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum empréstimo encontrado para os critérios selecionados.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
