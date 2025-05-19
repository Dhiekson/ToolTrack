
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CalendarDays, FileText, Download, Search, User, Printer, Filter } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Loan, ToolCategory } from "@/types/types";
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
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
// Need to include jspdf-autotable as a side effect to add autoTable method to jsPDF
import "jspdf-autotable";

// Extend jsPDF type to include autoTable method
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => any;
    lastAutoTable: {
      finalY: number;
    };
  }
}

const Reports = () => {
  const navigate = useNavigate();
  const { loans, employees } = useTools();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const [reportType, setReportType] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

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
    const matchesEmployee = employeeFilter === "" || 
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
      
      if (employeeFilter !== "") {
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
      doc.autoTable({
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
  
  // Função para imprimir a página
  const handlePrint = () => {
    try {
      window.print();
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div>
              <label className="block text-sm font-medium mb-2">Funcionário</label>
              <Select
                value={employeeFilter}
                onValueChange={setEmployeeFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os funcionários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os funcionários</SelectItem>
                  {uniqueBorrowers.map(borrower => (
                    <SelectItem key={borrower} value={borrower}>{borrower}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="pt-4 flex justify-center gap-4 flex-wrap">
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium mb-2">Busca por Funcionário</label>
              <div className="relative">
                <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Filtrar por nome do funcionário"
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mb-6 gap-4 flex-wrap print:hidden">
        <Button onClick={generatePDF} className="flex-grow md:flex-grow-0">
          <Download className="mr-2 h-4 w-4" />
          Gerar PDF
        </Button>
        <Button onClick={handlePrint} className="flex-grow md:flex-grow-0">
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
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
            {employeeFilter && ` - Filtrado por: ${employeeFilter}`}
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
    </div>
  );
};

export default Reports;
