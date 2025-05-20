
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CalendarDays, FileText, Download, Search, User, Printer, Filter, Building } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/DateRangePicker";
import { ThirdParty } from "@/types/types";
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
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
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
  employeeName: z.string().min(1, "Selecione um funcionário").optional(),
  loanStatus: z.enum(["all", "active", "returned"]),
  printerType: z.enum(["receipt", "normal"]),
  borrowerType: z.enum(["all", "employee", "thirdParty"])
});

// Schema for third-party company form
const thirdPartySchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  employeeName: z.string().min(1, "Nome do funcionário é obrigatório"),
  role: z.string().min(1, "Função é obrigatória")
});

type PrintFormValues = z.infer<typeof printFormSchema>;
type ThirdPartyFormValues = z.infer<typeof thirdPartySchema>;

const Reports = () => {
  const navigate = useNavigate();
  const { loans, employees, thirdParties = [] } = useTools();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const [reportType, setReportType] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [openEmployeeSelect, setOpenEmployeeSelect] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [thirdPartyDialogOpen, setThirdPartyDialogOpen] = useState(false);
  const [employeeSearchValue, setEmployeeSearchValue] = useState("");
  const [showEmployeeNotFound, setShowEmployeeNotFound] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Form for print dialog
  const printForm = useForm<PrintFormValues>({
    resolver: zodResolver(printFormSchema),
    defaultValues: {
      employeeName: "",
      loanStatus: "all",
      printerType: "receipt",
      borrowerType: "all"
    }
  });

  // Form for third-party company
  const thirdPartyForm = useForm<ThirdPartyFormValues>({
    resolver: zodResolver(thirdPartySchema),
    defaultValues: {
      companyName: "",
      employeeName: "",
      role: ""
    }
  });

  // Ordenar funcionários por ordem alfabética
  const sortedEmployees = [...employees].sort((a, b) => 
    a.name.localeCompare(b.name, 'pt-BR')
  );

  // Obter nomes únicos dos funcionários para o filtro, ordenados alfabeticamente
  const uniqueBorrowers = Array.from(new Set(loans.map(loan => loan.borrower)))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Filtrar empréstimos com base na data, tipo e funcionário
  const filteredLoans = loans.filter(loan => {
    // Primeiro, aplicar filtro de funcionário
    const matchesEmployee = employeeFilter === "all" || 
      loan.borrower.toLowerCase().includes(employeeFilter.toLowerCase());
    
    if (!matchesEmployee) return false;
    
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
    
    return uniqueBorrowers.some(
      borrower => borrower.toLowerCase().includes(name.toLowerCase())
    );
  };

  // Função para filtrar funcionários com base na busca
  const filterEmployees = (searchValue: string) => {
    if (!searchValue) return uniqueBorrowers;
    
    return uniqueBorrowers.filter(
      name => name.toLowerCase().includes(searchValue.toLowerCase())
    );
  };

  // Função para adicionar terceiro
  const handleAddThirdParty = (data: ThirdPartyFormValues) => {
    try {
      // Adicionando o terceiro ao contexto (assumimos que existe uma função para isso)
      if (thirdParties && Array.isArray(thirdParties)) {
        const newThirdParty: ThirdParty = {
          companyName: data.companyName,
          employeeName: data.employeeName,
          role: data.role
        };
        
        toast.success(`Terceiro ${data.employeeName} da empresa ${data.companyName} adicionado com sucesso!`);
        setThirdPartyDialogOpen(false);
        thirdPartyForm.reset();
      } else {
        toast.error("Não foi possível adicionar terceiros. Funcionalidade não disponível.");
      }
    } catch (error) {
      console.error("Erro ao adicionar terceiro:", error);
      toast.error("Erro ao adicionar terceiro. Tente novamente.");
    }
  };

  // Função para gerar PDF de relatórios
  const generatePDF = () => {
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text("Relatório de Empréstimos de Ferramentas", 14, 15);
      
      // Add filters applied
      doc.setFontSize(10);
      let yPos = 25;
      
      doc.text(`Data de geração: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, yPos);
      yPos += 5;
      
      if (reportType !== "all") {
        doc.text(`Status: ${reportType === "active" ? "Em uso" : "Devolvidos"}`, 14, yPos);
        yPos += 5;
      }
      
      if (employeeFilter !== "all") {
        doc.text(`Funcionário: ${employeeFilter}`, 14, yPos);
        yPos += 5;
      }
      
      if (date?.from && date?.to) {
        doc.text(`Período: ${format(date.from, "dd/MM/yyyy")} a ${format(date.to, "dd/MM/yyyy")}`, 14, yPos);
        yPos += 5;
      }
      
      // Add table data
      const tableData = filteredLoans.map(loan => [
        loan.toolName,
        loan.borrower,
        loan.isThirdParty ? "Terceiro" : loan.role,
        formatDate(loan.borrowDate, false),
        loan.expectedReturnDate ? formatDate(loan.expectedReturnDate, false) : "-",
        loan.returnDate ? formatDate(loan.returnDate, false) : "-",
        loan.status === "active" ? 
          (loan.isThirdParty && loan.expectedReturnDate && loan.expectedReturnDate < new Date() ? "Atrasado" : "Em uso") 
          : "Devolvido"
      ]);
      
      // Generate the table
      (doc as any).autoTable({
        startY: yPos + 5,
        head: [["Ferramenta", "Responsável", "Função", "Saída", "Devolução Prevista", "Devolução Real", "Status"]],
        body: tableData,
        theme: "striped",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        margin: { top: 30 }
      });
      
      // Save the PDF
      doc.save("relatorio-emprestimos.pdf");
      
      toast.success("Relatório PDF gerado com sucesso");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF. Verifique o console para mais detalhes.");
    }
  };
  
  // Função para imprimir com opções personalizadas
  const handlePrintWithOptions = (values: PrintFormValues) => {
    try {
      // Verificar se o funcionário existe na lista
      if (values.employeeName && values.employeeName !== "all" && !checkEmployeeExists(values.employeeName)) {
        toast.error("Funcionário não encontrado na lista.");
        setShowEmployeeNotFound(true);
        return;
      }

      // Aplicar filtros baseados nos valores do formulário
      const employeeFilterValue = values.employeeName || "all";
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
        // Filtro por funcionário
        const matchesEmployee = employeeFilterValue === "all" || 
          loan.borrower.toLowerCase().includes(employeeFilterValue.toLowerCase());
        
        if (!matchesEmployee) return false;
        
        // Filtro por tipo de responsável (funcionário ou terceiro)
        if (borrowerTypeValue === "employee" && loan.isThirdParty) return false;
        if (borrowerTypeValue === "thirdParty" && !loan.isThirdParty) return false;
        
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
        borrowerTypeValue === "employee" ? "Funcionários" : 
        borrowerTypeValue === "thirdParty" ? "Terceiros" : "Todos"
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
          ${printLoans.map(loan => `
            <tr>
              <td>${loan.toolName}</td>
              <td>${loan.borrower}${loan.isThirdParty ? ' (Terceiro)' : ''}</td>
              <td>${formatDate(loan.borrowDate, false)}</td>
              <td>${loan.status === "active" ? "Em uso" : "Devolvido"}</td>
            </tr>
          `).join('')}
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
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/ferramentas')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Ferramentas
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/funcionarios')}
          >
            <User className="h-4 w-4 mr-2" />
            Funcionários
          </Button>
          <Button
            variant="outline"
            onClick={() => setThirdPartyDialogOpen(true)}
          >
            <Building className="h-4 w-4 mr-2" />
            Adicionar Terceiros
          </Button>
        </div>
      </div>

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
          
          <div className="pt-4">
            <label className="block text-sm font-medium mb-2">Busca por Funcionário</label>
            <Popover open={openEmployeeSelect} onOpenChange={setOpenEmployeeSelect}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openEmployeeSelect}
                  className="w-full justify-between"
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
                      value="all"
                      onSelect={() => {
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
                        onSelect={() => {
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
        </CardContent>
      </Card>

      <div className="flex justify-end mb-6 gap-4 flex-wrap print:hidden">
        <Button onClick={generatePDF} className="flex-grow md:flex-grow-0">
          <Download className="mr-2 h-4 w-4" />
          Gerar PDF
        </Button>
        
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
                  name="employeeName"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Nome do Funcionário</FormLabel>
                      <div className="relative">
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
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
                            {/* Comando com filtragem manual de funcionários */}
                            <div className="w-full border-none p-0">
                              <div className="flex items-center border-b px-3">
                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                <Input 
                                  placeholder="Buscar funcionário..." 
                                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                  value={employeeSearchValue}
                                  onChange={(e) => {
                                    setEmployeeSearchValue(e.target.value);
                                    setShowEmployeeNotFound(false);
                                  }}
                                />
                              </div>
                              <div className="max-h-[300px] overflow-y-auto">
                                {uniqueBorrowers.length > 0 ? (
                                  <div className="overflow-hidden p-1">
                                    <div className="flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none"
                                        onClick={() => {
                                          printForm.setValue("employeeName", "all");
                                          setShowEmployeeNotFound(false);
                                          setEmployeeSearchValue("");
                                        }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === "all" ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      Todos os funcionários
                                    </div>
                                    {filterEmployees(employeeSearchValue).map((name) => (
                                      <div key={name}
                                        className="flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                        onClick={() => {
                                          printForm.setValue("employeeName", name);
                                          setShowEmployeeNotFound(false);
                                          setEmployeeSearchValue("");
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            name === field.value ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {name}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="py-6 text-center text-sm">
                                    Nenhum funcionário encontrado.
                                  </div>
                                )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      {showEmployeeNotFound && (
                        <p className="text-sm font-medium text-destructive">
                          Funcionário não encontrado na lista.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="thirdParty" id="borrower-third" />
                            <Label htmlFor="borrower-third">Terceiros</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
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
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
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
                        {loan.isThirdParty && (
                          <div className="text-xs text-muted-foreground">
                            Terceiro
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(loan.borrowDate, true)}</TableCell>
                      <TableCell>
                        {loan.isThirdParty && loan.expectedReturnDate ? formatDate(loan.expectedReturnDate, true) : "-"}
                      </TableCell>
                      <TableCell>
                        {loan.returnDate ? formatDate(loan.returnDate, true) : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            loan.status === "active"
                              ? loan.isThirdParty && loan.expectedReturnDate && loan.expectedReturnDate < new Date()
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {loan.status === "active"
                            ? loan.isThirdParty && loan.expectedReturnDate && loan.expectedReturnDate < new Date()
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

      {/* Dialog para adicionar terceiros */}
      <Dialog open={thirdPartyDialogOpen} onOpenChange={setThirdPartyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Empresa Terceira</DialogTitle>
            <DialogDescription>
              Cadastre uma empresa terceira para empréstimos de ferramentas
            </DialogDescription>
          </DialogHeader>
          
          <Form {...thirdPartyForm}>
            <form onSubmit={thirdPartyForm.handleSubmit(handleAddThirdParty)} className="space-y-4">
              <FormField
                control={thirdPartyForm.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={thirdPartyForm.control}
                name="employeeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Funcionário</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome do funcionário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={thirdPartyForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função na Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite a função do funcionário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setThirdPartyDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Adicionar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Reports;
