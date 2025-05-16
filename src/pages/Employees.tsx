
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTools } from "@/context/ToolsContext";
import { Employee } from "@/types/types";
import EmployeesList from "@/components/EmployeesList";
import AddEmployeeForm from "@/components/AddEmployeeForm";

const Employees = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useTools();

  const handleAddEmployee = (employee: Omit<Employee, "id">) => {
    addEmployee(employee);
    toast({
      title: "Funcionário adicionado",
      description: `${employee.name} foi adicionado com sucesso.`,
    });
  };

  const handleUpdateEmployee = (updatedEmployee: Employee) => {
    updateEmployee(updatedEmployee);
    toast({
      title: "Funcionário atualizado",
      description: `${updatedEmployee.name} foi atualizado com sucesso.`,
    });
  };

  const handleDeleteEmployee = (id: string) => {
    const employee = employees.find(e => e.id === id);
    if (!employee) return;
    
    deleteEmployee(id);
    toast({
      title: "Funcionário excluído",
      description: `${employee.name} foi excluído com sucesso.`,
      variant: "destructive"
    });
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
          Gerenciamento de Funcionários
        </h1>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="list">Lista de Funcionários</TabsTrigger>
          <TabsTrigger value="add">Novo Funcionário</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Funcionários Cadastrados</CardTitle>
              <CardDescription>
                Gerencie todos os funcionários cadastrados no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeesList 
                employees={employees} 
                onUpdate={handleUpdateEmployee} 
                onDelete={handleDeleteEmployee} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Novo Funcionário</CardTitle>
              <CardDescription>
                Cadastre um novo funcionário no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddEmployeeForm onAddEmployee={handleAddEmployee} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Employees;
