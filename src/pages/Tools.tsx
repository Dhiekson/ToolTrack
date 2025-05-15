
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
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTools } from "@/context/ToolsContext";
import { Tool } from "@/types/types";

const Tools = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { tools, addTool, updateTool, deleteTool } = useTools();

  const handleAddTool = (tool: Omit<Tool, "id">) => {
    addTool(tool);
    toast({
      title: "Ferramenta adicionada",
      description: `${tool.name} foi adicionada com sucesso.`,
    });
  };

  const handleUpdateTool = (updatedTool: Tool) => {
    updateTool(updatedTool);
    toast({
      title: "Ferramenta atualizada",
      description: `${updatedTool.name} foi atualizada com sucesso.`,
    });
  };

  const handleDeleteTool = (id: string) => {
    const tool = tools.find(t => t.id === id);
    if (!tool) return;
    
    deleteTool(id);
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
              <ToolsList tools={tools} onDelete={handleDeleteTool} onUpdate={handleUpdateTool} />
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
              <AddToolForm onAddTool={handleAddTool} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tools;
