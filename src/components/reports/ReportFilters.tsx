
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Building } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface ReportFiltersProps {
  date: DateRange | undefined;
  reportType: string;
  employeeFilter: string;
  companyFilter: string;
  uniqueEmployeeBorrowers: string[];
  uniqueCompanies: string[];
  onDateChange: (date: DateRange | undefined) => void;
  onReportTypeChange: (value: string) => void;
  onEmployeeFilterChange: (value: string) => void;
  onCompanyFilterChange: (value: string) => void;
}

export function ReportFilters({
  date,
  reportType,
  employeeFilter,
  companyFilter,
  uniqueEmployeeBorrowers,
  uniqueCompanies,
  onDateChange,
  onReportTypeChange,
  onEmployeeFilterChange,
  onCompanyFilterChange,
}: ReportFiltersProps) {
  const [openEmployeeSelect, setOpenEmployeeSelect] = useState(false);
  const [openCompanySelect, setOpenCompanySelect] = useState(false);
  const [employeeSearchValue, setEmployeeSearchValue] = useState("");
  const [companySearchValue, setCompanySearchValue] = useState("");

  // Funções auxiliares
  const filterEmployees = (searchValue: string) => {
    if (!searchValue) return uniqueEmployeeBorrowers;
    return uniqueEmployeeBorrowers.filter(
      name => name.toLowerCase().includes(searchValue.toLowerCase())
    );
  };

  const filterCompanies = (searchValue: string) => {
    if (!searchValue) return uniqueCompanies;
    return uniqueCompanies.filter(
      company => company.toLowerCase().includes(searchValue.toLowerCase())
    );
  };

  return (
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
              onDateChange={onDateChange}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Relatório</label>
            <Select
              value={reportType}
              onValueChange={onReportTypeChange}
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
                    e.preventDefault();
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
                      onSelect={() => {
                        onEmployeeFilterChange("all");
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
                          onEmployeeFilterChange(name);
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
                    e.preventDefault();
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
                      onSelect={() => {
                        onCompanyFilterChange("all");
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
                        onSelect={() => {
                          onCompanyFilterChange(company);
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
  );
}
