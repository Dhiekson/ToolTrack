
import { useState } from "react";
import { Loan } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

interface LoansListProps {
  loans: Loan[];
  onReturn: (id: string) => void;
}

const LoansList = ({ loans, onReturn }: LoansListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredLoans = loans.filter(
    (loan) =>
      (searchTerm === "" ||
        loan.toolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.borrower.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all" || loan.status === statusFilter)
  );

  const isOverdue = (loan: Loan) => {
    return (
      loan.status === "active" &&
      loan.isThirdParty &&
      loan.expectedReturnDate < new Date()
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por ferramenta ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Todos status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="active">Em uso</SelectItem>
            <SelectItem value="returned">Devolvidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredLoans.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
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
                    {loan.isThirdParty ? formatDate(loan.expectedReturnDate, true) : "-"}
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
