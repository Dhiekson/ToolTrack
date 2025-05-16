
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Dashboard from "@/components/Dashboard";
import LoansList from "@/components/LoansList";
import AddLoanForm from "@/components/AddLoanForm";
import { useTools } from "@/context/ToolsContext";
import { FileText, Wrench, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const navigate = useNavigate();
  const { tools, loans, employees, addLoan, returnTool, isLoading } = useTools();
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-8 w-80" />
          <div className="space-x-4">
            <Skeleton className="h-10 w-32 inline-block" />
            <Skeleton className="h-10 w-40 inline-block" />
          </div>
        </div>
        <Skeleton className="h-12 w-full mb-8" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">
          Sistema de Gerenciamento de Ferramentas
        </h1>
        <div className="space-x-4">
          <Button onClick={() => navigate('/relatorios')}>
            <FileText className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
          <Button onClick={() => navigate('/ferramentas')}>
            <Wrench className="h-4 w-4 mr-2" />
            Ferramentas
          </Button>
          <Button onClick={() => navigate('/funcionarios')}>
            <Users className="h-4 w-4 mr-2" />
            Funcionários
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="loans">Empréstimos</TabsTrigger>
          <TabsTrigger value="addLoan">Novo Empréstimo</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Dashboard tools={tools} loans={loans} />
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
              <LoansList loans={loans} employees={employees} onReturn={returnTool} />
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
              <AddLoanForm tools={tools} employees={employees} onAddLoan={addLoan} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
