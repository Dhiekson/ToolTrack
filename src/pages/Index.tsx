
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Dashboard from "@/components/Dashboard";
import ToolsList from "@/components/ToolsList";
import LoansList from "@/components/LoansList";
import AddToolForm from "@/components/AddToolForm";
import AddLoanForm from "@/components/AddLoanForm";
import { Tool, Loan, ToolCategory } from "@/types/types";

const Index = () => {
  // Estado inicial para ferramentas
  const [tools, setTools] = useState<Tool[]>([
    {
      id: "1",
      name: "Furadeira Elétrica",
      category: ToolCategory.ELECTRIC,
      quantity: 3,
      available: 2,
    },
    {
      id: "2",
      name: "Chave de Fenda",
      category: ToolCategory.MANUAL,
      quantity: 10,
      available: 8,
    },
    {
      id: "3",
      name: "Scanner OBD",
      category: ToolCategory.DIAGNOSTIC,
      quantity: 2,
      available: 1,
    },
  ]);

  // Estado inicial para empréstimos
  const [loans, setLoans] = useState<Loan[]>([
    {
      id: "1",
      toolId: "1",
      toolName: "Furadeira Elétrica",
      borrower: "João Silva",
      role: "Mecânico",
      isThirdParty: false,
      borrowDate: new Date(2023, 4, 15, 9, 30),
      expectedReturnDate: new Date(2023, 4, 16, 17, 0),
      returnDate: null,
      status: "active",
    },
    {
      id: "2",
      toolId: "2",
      toolName: "Chave de Fenda",
      borrower: "ABC Construções",
      role: "",
      isThirdParty: true,
      borrowDate: new Date(2023, 4, 10, 14, 0),
      expectedReturnDate: new Date(2023, 4, 20, 14, 0),
      returnDate: null,
      status: "active",
    },
    {
      id: "3",
      toolId: "3",
      toolName: "Scanner OBD",
      borrower: "Maria Oliveira",
      role: "Eletricista",
      isThirdParty: false,
      borrowDate: new Date(2023, 4, 5, 8, 0),
      expectedReturnDate: new Date(2023, 4, 6, 17, 0),
      returnDate: new Date(2023, 4, 6, 16, 30),
      status: "returned",
    },
  ]);

  const addTool = (tool: Omit<Tool, "id">) => {
    const newTool = {
      ...tool,
      id: Math.random().toString(36).substr(2, 9),
      available: tool.quantity,
    };
    setTools([...tools, newTool]);
  };

  const updateTool = (updatedTool: Tool) => {
    setTools(
      tools.map((tool) => (tool.id === updatedTool.id ? updatedTool : tool))
    );
  };

  const deleteTool = (id: string) => {
    // Verificar se há empréstimos ativos para esta ferramenta
    const hasActiveLoans = loans.some(
      (loan) => loan.toolId === id && loan.status === "active"
    );
    
    if (hasActiveLoans) {
      alert("Não é possível excluir uma ferramenta com empréstimos ativos.");
      return;
    }
    
    setTools(tools.filter((tool) => tool.id !== id));
    // Remover também os empréstimos relacionados
    setLoans(loans.filter((loan) => loan.toolId !== id));
  };

  const addLoan = (loan: Omit<Loan, "id" | "status">) => {
    // Encontrar a ferramenta
    const tool = tools.find((t) => t.id === loan.toolId);
    if (!tool || tool.available <= 0) {
      alert("Ferramenta não disponível para empréstimo!");
      return;
    }

    // Atualizar a disponibilidade da ferramenta
    const updatedTools = tools.map((t) =>
      t.id === loan.toolId ? { ...t, available: t.available - 1 } : t
    );
    
    // Adicionar o empréstimo
    const newLoan = {
      ...loan,
      id: Math.random().toString(36).substr(2, 9),
      status: "active",
    };
    
    setTools(updatedTools);
    setLoans([...loans, newLoan]);
  };

  const returnTool = (loanId: string) => {
    // Encontrar o empréstimo
    const loan = loans.find((l) => l.id === loanId);
    if (!loan || loan.status !== "active") return;

    // Atualizar o empréstimo
    const updatedLoans = loans.map((l) =>
      l.id === loanId
        ? { ...l, status: "returned", returnDate: new Date() }
        : l
    );

    // Atualizar a disponibilidade da ferramenta
    const updatedTools = tools.map((t) =>
      t.id === loan.toolId ? { ...t, available: t.available + 1 } : t
    );

    setLoans(updatedLoans);
    setTools(updatedTools);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-primary mb-8 text-center">
        Sistema de Gerenciamento de Ferramentas
      </h1>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="tools">Ferramentas</TabsTrigger>
          <TabsTrigger value="loans">Empréstimos</TabsTrigger>
          <TabsTrigger value="addTool">Nova Ferramenta</TabsTrigger>
          <TabsTrigger value="addLoan">Novo Empréstimo</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Dashboard tools={tools} loans={loans} />
        </TabsContent>

        <TabsContent value="tools">
          <Card>
            <CardHeader>
              <CardTitle>Inventário de Ferramentas</CardTitle>
              <CardDescription>
                Gerencie todas as ferramentas disponíveis no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ToolsList tools={tools} onDelete={deleteTool} onUpdate={updateTool} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Empréstimos</CardTitle>
              <CardDescription>
                Controle todos os empréstimos ativos e histórico de devoluções.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoansList loans={loans} onReturn={returnTool} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addTool">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Nova Ferramenta</CardTitle>
              <CardDescription>
                Cadastre uma nova ferramenta no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddToolForm onAddTool={addTool} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addLoan">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Novo Empréstimo</CardTitle>
              <CardDescription>
                Registre a saída de uma ferramenta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddLoanForm tools={tools} onAddLoan={addLoan} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
