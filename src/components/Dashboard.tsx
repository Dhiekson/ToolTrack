
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tool, Loan } from "@/types/types";
import { formatDate } from "@/lib/utils";

interface DashboardProps {
  tools: Tool[];
  loans: Loan[];
}

const Dashboard = ({ tools, loans }: DashboardProps) => {
  const totalTools = tools.reduce((sum, tool) => sum + tool.quantity, 0);
  const availableTools = tools.reduce((sum, tool) => sum + tool.available, 0);
  const activeLoans = loans.filter((loan) => loan.status === "active").length;
  const overdueLoans = loans.filter(
    (loan) => 
      loan.status === "active" && 
      loan.isThirdParty && 
      loan.expectedReturnDate < new Date()
  ).length;

  const recentLoans = [...loans]
    .sort((a, b) => b.borrowDate.getTime() - a.borrowDate.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Ferramentas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTools}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ferramentas Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableTools}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Empréstimos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLoans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Empréstimos Atrasados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueLoans}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empréstimos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {recentLoans.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left">Ferramenta</th>
                      <th className="px-4 py-3 text-left">Responsável</th>
                      <th className="px-4 py-3 text-left">Data de Saída</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLoans.map((loan) => (
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
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              loan.status === "active"
                                ? loan.isThirdParty && loan.expectedReturnDate < new Date()
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {loan.status === "active" 
                              ? loan.isThirdParty && loan.expectedReturnDate < new Date()
                                ? "Atrasado" 
                                : "Em uso" 
                              : "Devolvido"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Nenhum empréstimo registrado.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
