
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Dashboard from "@/components/Dashboard";
import LoansList from "@/components/LoansList";
import AddLoanForm from "@/components/AddLoanForm";
import { useTools } from "@/context/ToolsContext";
import { FileText, Wrench, Users, Building, Pencil, Trash2, Eye, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ThirdParty } from "@/types/types";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Schema for third-party company form
const thirdPartySchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  employeeName: z.string().min(1, "Nome do funcionário é obrigatório"),
  role: z.string().min(1, "Função é obrigatória")
});

// Schema for adding employee to third-party company
const thirdPartyEmployeeSchema = z.object({
  employeeName: z.string().min(1, "Nome do funcionário é obrigatório"),
  role: z.string().min(1, "Função é obrigatória")
});

type ThirdPartyFormValues = z.infer<typeof thirdPartySchema>;
type ThirdPartyEmployeeFormValues = z.infer<typeof thirdPartyEmployeeSchema>;

const Index = () => {
  const navigate = useNavigate();
  const { tools, loans, employees, thirdParties = [], addLoan, returnTool, isLoading, addThirdParty, updateThirdParty, deleteThirdParty } = useTools();
  const [thirdPartyDialogOpen, setThirdPartyDialogOpen] = useState(false);
  const [editingThirdParty, setEditingThirdParty] = useState<ThirdParty | null>(null);
  const [thirdPartyToDelete, setThirdPartyToDelete] = useState<ThirdParty | null>(null);
  const [thirdPartyAlertOpen, setThirdPartyAlertOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCompany, setSelectedCompany] = useState<ThirdParty | null>(null);
  const [companyViewOpen, setCompanyViewOpen] = useState(false);
  const [addEmployeeDialogOpen, setAddEmployeeDialogOpen] = useState(false);

  // Form for third-party company
  const thirdPartyForm = useForm<ThirdPartyFormValues>({
    resolver: zodResolver(thirdPartySchema),
    defaultValues: {
      companyName: "",
      employeeName: "",
      role: ""
    }
  });
  
  // Form for adding employee to third-party company
  const thirdPartyEmployeeForm = useForm<ThirdPartyEmployeeFormValues>({
    resolver: zodResolver(thirdPartyEmployeeSchema),
    defaultValues: {
      employeeName: "",
      role: ""
    }
  });

  // Set editingThirdParty values when it changes
  useState(() => {
    if (editingThirdParty) {
      thirdPartyForm.setValue("companyName", editingThirdParty.companyName);
      thirdPartyForm.setValue("employeeName", editingThirdParty.employeeName);
      thirdPartyForm.setValue("role", editingThirdParty.role);
    } else {
      thirdPartyForm.reset();
    }
  });
  
  // Ordenar terceiros por ordem alfabética
  const sortedThirdParties = [...(thirdParties || [])].sort((a, b) => 
    a.companyName.localeCompare(b.companyName, 'pt-BR') || 
    a.employeeName.localeCompare(b.employeeName, 'pt-BR')
  );
  
  // Agrupar terceiros por empresa
  const groupedThirdParties = sortedThirdParties.reduce((acc, tp) => {
    const companyName = tp.companyName;
    if (!acc[companyName]) {
      acc[companyName] = [];
    }
    acc[companyName].push(tp);
    return acc;
  }, {} as Record<string, ThirdParty[]>);
  
  // Lista de empresas únicas
  const uniqueCompanies = Object.keys(groupedThirdParties).sort((a, b) => 
    a.localeCompare(b, 'pt-BR')
  );

  // Função para adicionar terceiro
  const handleAddThirdParty = (data: ThirdPartyFormValues) => {
    try {
      if (editingThirdParty) {
        // Atualizar o terceiro existente
        updateThirdParty({
          companyName: data.companyName,
          employeeName: data.employeeName,
          role: data.role
        });
        setEditingThirdParty(null);
      } else {
        // Adicionar novo terceiro
        addThirdParty({
          companyName: data.companyName,
          employeeName: data.employeeName,
          role: data.role
        });
      }
      
      setThirdPartyDialogOpen(false);
      thirdPartyForm.reset();
      toast.success(editingThirdParty ? "Terceiro atualizado com sucesso" : "Terceiro adicionado com sucesso");
    } catch (error) {
      console.error("Erro ao adicionar/atualizar terceiro:", error);
      toast.error("Erro ao adicionar/atualizar terceiro. Tente novamente.");
    }
  };

  // Função para adicionar funcionário à empresa terceira
  const handleAddEmployeeToCompany = (data: ThirdPartyEmployeeFormValues) => {
    try {
      if (selectedCompany) {
        // Adicionar funcionário à empresa selecionada
        addThirdParty({
          companyName: selectedCompany.companyName,
          employeeName: data.employeeName,
          role: data.role
        });
        
        setAddEmployeeDialogOpen(false);
        thirdPartyEmployeeForm.reset();
        toast.success("Funcionário adicionado com sucesso");
        
        // Atualizar a visualização da empresa
        if (companyViewOpen) {
          const updatedCompany = {
            ...selectedCompany,
            employeeName: data.employeeName,
            role: data.role
          };
          setSelectedCompany(updatedCompany);
        }
      }
    } catch (error) {
      console.error("Erro ao adicionar funcionário:", error);
      toast.error("Erro ao adicionar funcionário. Tente novamente.");
    }
  };

  // Função para editar terceiro
  const handleEditThirdParty = (thirdParty: ThirdParty) => {
    setEditingThirdParty(thirdParty);
    setThirdPartyDialogOpen(true);
  };

  // Função para confirmar exclusão de terceiro
  const handleDeleteThirdParty = () => {
    if (thirdPartyToDelete) {
      deleteThirdParty(thirdPartyToDelete.companyName, thirdPartyToDelete.employeeName);
      setThirdPartyToDelete(null);
      setThirdPartyAlertOpen(false);
      toast.success("Terceiro removido com sucesso");
    }
  };

  // Função para abrir o diálogo de exclusão
  const openDeleteDialog = (thirdParty: ThirdParty) => {
    setThirdPartyToDelete(thirdParty);
    setThirdPartyAlertOpen(true);
  };
  
  // Função para visualizar empresa terceira
  const viewCompany = (companyName: string) => {
    const companyEmployees = groupedThirdParties[companyName] || [];
    if (companyEmployees.length > 0) {
      setSelectedCompany({
        companyName,
        employeeName: companyEmployees[0].employeeName,
        role: companyEmployees[0].role
      });
      setCompanyViewOpen(true);
      setActiveTab("thirdParties");
    }
  };
  
  // Função para adicionar funcionário à empresa selecionada
  const addEmployeeToCompany = () => {
    if (selectedCompany) {
      thirdPartyEmployeeForm.reset();
      setAddEmployeeDialogOpen(true);
    }
  };

  // Função para renderizar a lista de empresas terceiras
  const renderThirdPartyCompaniesList = () => {
    return (
      <div className="mt-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Empresas Terceiras</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setEditingThirdParty(null);
              setThirdPartyDialogOpen(true);
            }}
          >
            Adicionar Nova Empresa
          </Button>
        </div>
        
        {uniqueCompanies.length > 0 ? (
          <div className="space-y-2">
            {uniqueCompanies.map((companyName) => {
              const employees = groupedThirdParties[companyName];
              return (
                <Card key={companyName} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{companyName}</CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => viewCompany(companyName)}
                        >
                          <Eye size={16} className="mr-1" />
                          Ver Funcionários
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {employees.length} {employees.length === 1 ? 'funcionário cadastrado' : 'funcionários cadastrados'}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground border rounded-md">
            Nenhuma empresa terceira cadastrada
          </div>
        )}
      </div>
    );
  };

  // Função para renderizar a lista de funcionários de uma empresa
  const renderCompanyEmployees = () => {
    if (!selectedCompany) return null;
    
    const companyEmployees = groupedThirdParties[selectedCompany.companyName] || [];
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">{selectedCompany.companyName}</h3>
            <p className="text-muted-foreground">Funcionários cadastrados</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setCompanyViewOpen(false)}
            >
              Voltar
            </Button>
            <Button
              onClick={addEmployeeToCompany}
            >
              Adicionar Funcionário
            </Button>
          </div>
        </div>
        
        {companyEmployees.length > 0 ? (
          <div className="space-y-2">
            {companyEmployees.map((employee, index) => (
              <div 
                key={`${employee.employeeName}-${index}`} 
                className="p-4 border rounded-md flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{employee.employeeName}</div>
                  <div className="text-sm text-muted-foreground">{employee.role}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditThirdParty(employee)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => openDeleteDialog(employee)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground border rounded-md">
            Nenhum funcionário cadastrado para esta empresa
          </div>
        )}
      </div>
    );
  };
  
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

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="loans">Empréstimos</TabsTrigger>
          <TabsTrigger value="addLoan">Novo Empréstimo</TabsTrigger>
          <TabsTrigger value="thirdParties">
            <Building className="h-4 w-4 mr-2" />
            Empresas Terceiras
          </TabsTrigger>
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
        
        <TabsContent value="thirdParties">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Empresas Terceiras
              </CardTitle>
              <CardDescription>
                Gerencie empresas terceiras e seus funcionários para empréstimos de ferramentas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {companyViewOpen ? renderCompanyEmployees() : renderThirdPartyCompaniesList()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Dialog para adicionar terceiros */}
      <Dialog open={thirdPartyDialogOpen} onOpenChange={(open) => {
        setThirdPartyDialogOpen(open);
        if (!open) setEditingThirdParty(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingThirdParty ? "Editar Empresa Terceira" : "Adicionar Empresa Terceira"}
            </DialogTitle>
            <DialogDescription>
              {editingThirdParty 
                ? "Edite os dados da empresa terceira" 
                : "Cadastre uma empresa terceira para empréstimos de ferramentas"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...thirdPartyForm}>
            <form onSubmit={thirdPartyForm.handleSubmit(handleAddThirdParty)} className="space-y-4">
              <FormField
                control={thirdPartyForm.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={thirdPartyForm.control}
                name="employeeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Funcionário</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome do funcionário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={thirdPartyForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função na Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite a função do funcionário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => {
                    setThirdPartyDialogOpen(false);
                    setEditingThirdParty(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingThirdParty ? "Salvar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para adicionar funcionário à empresa */}
      <Dialog open={addEmployeeDialogOpen} onOpenChange={setAddEmployeeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Funcionário</DialogTitle>
            <DialogDescription>
              Adicione um novo funcionário à empresa {selectedCompany?.companyName}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...thirdPartyEmployeeForm}>
            <form onSubmit={thirdPartyEmployeeForm.handleSubmit(handleAddEmployeeToCompany)} className="space-y-4">
              <FormField
                control={thirdPartyEmployeeForm.control}
                name="employeeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Funcionário</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome do funcionário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={thirdPartyEmployeeForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função na Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite a função do funcionário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setAddEmployeeDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Adicionar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para excluir terceiro */}
      <AlertDialog open={thirdPartyAlertOpen} onOpenChange={setThirdPartyAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {thirdPartyToDelete?.employeeName} da empresa {thirdPartyToDelete?.companyName}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteThirdParty} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;

