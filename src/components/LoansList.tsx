
import { useState } from "react";
import { Loan, Employee } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { Search, Calendar, User } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface LoansListProps {
  loans: Loan[];
  employees: Employee[];
  onReturn: (id: string) => void;
}

const LoansList = ({ loans, employees, onReturn }: LoansListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [openEmployeeSelector, setOpenEmployeeSelector] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");

  // Filter loans based on all filters
  const filteredLoans = loans.filter((loan) => {
    // Text search filter
    const matchesSearch = 
      searchTerm === "" ||
      loan.toolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.borrower.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === "all" || loan.status === statusFilter;
    
    // Employee filter
    const matchesEmployee = !employeeFilter || loan.employeeId === employeeFilter;
    
    // Date range filter
    let matchesDateRange = true;
    if (dateRange.from && dateRange.to) {
      matchesDateRange = isWithinInterval(loan.borrowDate, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to)
      });
    }
    
    return matchesSearch && matchesStatus && matchesEmployee && matchesDateRange;
  });

  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
    employee.role.toLowerCase().includes(employeeSearchQuery.toLowerCase())
  );

  const isOverdue = (loan: Loan) => {
    return (
      loan.status === "active" &&
      loan.expectedReturnDate !== null &&
      loan.expectedReturnDate < new Date()
    );
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setEmployeeFilter(null);
    setDateRange({ from: undefined, to: undefined });
  };

  // Handle date range changes safely
  const handleDateRangeChange = (range: any) => {
    setDateRange({
      from: range?.from,
      to: range?.to
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2">
          <div className="flex items-center">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Buscar por ferramenta ou responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="active">Em uso</SelectItem>
              <SelectItem value="returned">Devolvidos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Popover open={openEmployeeSelector} onOpenChange={setOpenEmployeeSelector}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openEmployeeSelector}
                className="w-full justify-between"
              >
                {employeeFilter
                  ? employees.find((e) => e.id === employeeFilter)?.name || "Funcionário"
                  : "Todos funcionários"}
                <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
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
                  <CommandEmpty>Nenhum funcionário encontrado</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setEmployeeFilter(null);
                        setOpenEmployeeSelector(false);
                      }}
                    >
                      Todos funcionários
                    </CommandItem>
                    {filteredEmployees.map((employee) => (
                      <CommandItem
                        key={employee.id}
                        value={employee.id}
                        onSelect={() => {
                          setEmployeeFilter(employee.id);
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
        </div>
        
        <div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-between text-left font-normal",
                  !dateRange.from && "text-muted-foreground"
                )}
              >
                {dateRange.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy")
                  )
                ) : (
                  "Filtrar por data"
                )}
                <Calendar className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="range"
                selected={{ 
                  from: dateRange.from || undefined, 
                  to: dateRange.to || undefined
                }}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
                initialFocus
              />
              <div className="p-3 border-t flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  Limpar
                </Button>
                <Button 
                  size="sm"
                  onClick={() => {}}
                >
                  Aplicar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleClearFilters}>
          Limpar filtros
        </Button>
      </div>

      {filteredLoans.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-3 text-left">Ferramenta</th>
                <th className="px-4 py-3 text-left">Responsável</th>
                <th className="px-4 py-3 text-left">Saída</th>
                <th className="px-4 py-3 text-left">Devolução Prevista</th>
                <th className="px-4 py-3 text-left">Devolução Real</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="border-b">
                  <td className="px-4 py-3">{loan.toolName}</td>
                  <td className="px-4 py-3">
                    {loan.borrower}
                    {!loan.isThirdParty && loan.role && (
                      <span className="text-xs text-gray-500 block">
                        {loan.role}
                      </span>
                    )}
                    {loan.isThirdParty && (
                      <span className="text-xs text-gray-500 block">
                        Terceiro
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatDate(loan.borrowDate, true)}</td>
                  <td className="px-4 py-3">
                    {loan.expectedReturnDate ? formatDate(loan.expectedReturnDate, true) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {loan.returnDate ? formatDate(loan.returnDate, true) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        loan.status === "active"
                          ? isOverdue(loan)
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {loan.status === "active"
                        ? isOverdue(loan)
                          ? "Atrasado"
                          : "Em uso"
                        : "Devolvido"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {loan.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReturn(loan.id)}
                      >
                        Registrar Devolução
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum empréstimo encontrado.
        </div>
      )}
    </div>
  );
};

export default LoansList;
