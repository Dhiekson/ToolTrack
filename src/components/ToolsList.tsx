
import { useState } from "react";
import { Tool, ToolCategory } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface ToolsListProps {
  tools: Tool[];
  onDelete: (id: string) => void;
  onUpdate: (tool: Tool) => void;
}

const ToolsList = ({ tools, onDelete, onUpdate }: ToolsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  const filteredTools = tools.filter(
    (tool) =>
      (searchTerm === "" ||
        tool.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (categoryFilter === "" || tool.category === categoryFilter)
  );

  const handleEdit = (tool: Tool) => {
    setEditingTool({ ...tool });
  };

  const handleSaveEdit = () => {
    if (editingTool) {
      onUpdate(editingTool);
      setEditingTool(null);
    }
  };

  const getCategoryBadgeStyle = (category: ToolCategory) => {
    switch (category) {
      case ToolCategory.ELECTRIC:
        return "bg-blue-100 text-blue-800";
      case ToolCategory.MANUAL:
        return "bg-green-100 text-green-800";
      case ToolCategory.DIAGNOSTIC:
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar ferramentas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={setCategoryFilter}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Todas categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas categorias</SelectItem>
            <SelectItem value={ToolCategory.ELECTRIC}>Elétricas</SelectItem>
            <SelectItem value={ToolCategory.MANUAL}>Manuais</SelectItem>
            <SelectItem value={ToolCategory.DIAGNOSTIC}>Diagnóstico</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTools.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Categoria</th>
                <th className="px-4 py-3 text-center">Quantidade</th>
                <th className="px-4 py-3 text-center">Disponíveis</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTools.map((tool) => (
                <tr key={tool.id} className="border-b">
                  <td className="px-4 py-3">{tool.name}</td>
                  <td className="px-4 py-3">
                    <Badge className={getCategoryBadgeStyle(tool.category)}>
                      {tool.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">{tool.quantity}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={tool.available === 0 ? "text-destructive font-bold" : ""}>
                      {tool.available}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(tool)}>
                        Editar
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => onDelete(tool.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma ferramenta encontrada.
        </div>
      )}

      <Dialog open={!!editingTool} onOpenChange={(open) => !open && setEditingTool(null)}>
        {editingTool && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Ferramenta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={editingTool.name}
                  onChange={(e) =>
                    setEditingTool({ ...editingTool, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoria</Label>
                <Select
                  value={editingTool.category}
                  onValueChange={(value) =>
                    setEditingTool({ ...editingTool, category: value as ToolCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ToolCategory.ELECTRIC}>Elétrica</SelectItem>
                    <SelectItem value={ToolCategory.MANUAL}>Manual</SelectItem>
                    <SelectItem value={ToolCategory.DIAGNOSTIC}>Diagnóstico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantidade Total</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min={editingTool.quantity - editingTool.available}
                  value={editingTool.quantity}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value);
                    const diff = newQuantity - editingTool.quantity;
                    setEditingTool({
                      ...editingTool,
                      quantity: newQuantity,
                      available: Math.max(0, editingTool.available + diff),
                    });
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  Em uso: {editingTool.quantity - editingTool.available}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTool(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default ToolsList;
