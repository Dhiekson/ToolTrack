
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
import ToolsList from "@/components/ToolsList";
import AddToolForm from "@/components/AddToolForm";
import { Tool, ToolCategory } from "@/types/types";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Tools = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
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

  const addTool = (tool: Omit<Tool, "id">) => {
    const newTool = {
      ...tool,
      id: Math.random().toString(36).substr(2, 9),
      available: tool.quantity,
    };
    setTools([...tools, newTool]);
    toast({
      title: "Ferramenta adicionada",
      description: `${tool.name} foi adicionada com sucesso.`,
    });
  };

  const updateTool = (updatedTool: Tool) => {
    setTools(
      tools.map((tool) => (tool.id === updatedTool.id ? updatedTool : tool))
    );
    toast({
      title: "Ferramenta atualizada",
      description: `${updatedTool.name} foi atualizada com sucesso.`,
    });
  };

  const deleteTool = (id: string) => {
    const tool = tools.find(t => t.id === id);
    if (!tool) return;
    
    setTools(tools.filter((tool) => tool.id !== id));
    toast({
      title: "Ferramenta excluída",
      description: `${tool.name} foi excluída com sucesso.`,
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
          Gerenciamento de Ferramentas
        </h1>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="list">Inventário</TabsTrigger>
          <TabsTrigger value="add">Nova Ferramenta</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
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

        <TabsContent value="add">
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
      </Tabs>
    </div>
  );
};

export default Tools;
