
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CalendarDays, Printer } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { useTools } from "@/context/ToolsContext";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { ReportTable } from "@/components/reports/ReportTable";
import { PrintDialog } from "@/components/reports/PrintDialog";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Obter nomes únicos de funcionários não terceirizados para filtro, ordenados alfabeticamente
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

      {/* Filtros */}
      <ReportFilters 
        date={date}
        reportType={reportType}
        employeeFilter={employeeFilter}
        companyFilter={companyFilter}
        uniqueEmployeeBorrowers={uniqueEmployeeBorrowers}
        uniqueCompanies={uniqueCompanies}
        onDateChange={setDate}
        onReportTypeChange={setReportType}
        onEmployeeFilterChange={setEmployeeFilter}
        onCompanyFilterChange={setCompanyFilter}
      />

      {/* Botão de Impressão */}
      <div className="flex justify-end mb-6 print:hidden">
        <Button 
          className="flex-grow md:flex-grow-0"
          onClick={() => setDialogOpen(true)}
        >
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Dialog para impressão */}
      <PrintDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        loans={loans}
        uniqueEmployeeBorrowers={uniqueEmployeeBorrowers}
      />

      {/* Tabela de relatórios */}
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
          <ReportTable loans={filteredLoans} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
