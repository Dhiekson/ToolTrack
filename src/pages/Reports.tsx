
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CalendarDays, FileText, Download } from "lucide-react";
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
import "jspdf-autotable";

const Reports = () => {
  const navigate = useNavigate();
  const { loans, employees } = useTools();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const [reportType, setReportType] = useState<string>("all");

  // Filtrar empréstimos com base na data e tipo
  const filteredLoans = loans.filter(loan => {
    if (!date?.from || !date?.to) return true;
    
    const loanDate = loan.status === "returned" ? loan.returnDate : loan.borrowDate;
    if (!loanDate) return false;
    
    const isWithinDateRange = loanDate >= date.from && loanDate <= date.to;
    
    if (reportType === "all") return isWithinDateRange;
    if (reportType === "active") return isWithinDateRange && loan.status === "active";
    if (reportType === "returned") return isWithinDateRange && loan.status === "returned";
    
    return isWithinDateRange;
  });

  // Função para gerar PDF de relatórios
  const generatePDF = () => {
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
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
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

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
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
        </CardContent>
      </Card>

      <div className="flex justify-end mb-6">
        <Button onClick={generatePDF}>
          <Download className="mr-2 h-4 w-4" />
          Gerar Relatório PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Registro Histórico de Empréstimos
          </CardTitle>
          <CardDescription>
            {date?.from && date?.to
              ? `Relatório de ${formatDate(date.from)} até ${formatDate(date.to)}`
              : "Todos os registros"}
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
              Nenhum empréstimo encontrado para o período selecionado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
