
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { LoanWithToolData } from "@/types/types";

interface ReportTableProps {
  loans: LoanWithToolData[];
}

export function ReportTable({ loans }: ReportTableProps) {
  return (
    <>
      {loans.length > 0 ? (
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
              {loans.map((loan) => (
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
    </>
  );
}
