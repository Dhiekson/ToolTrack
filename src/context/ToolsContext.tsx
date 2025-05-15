
import { createContext, useContext, useState, ReactNode } from "react";
import { Tool, Loan, ToolCategory } from "@/types/types";

interface ToolsContextType {
  tools: Tool[];
  loans: Loan[];
  setTools: (tools: Tool[]) => void;
  setLoans: (loans: Loan[]) => void;
  addTool: (tool: Omit<Tool, "id">) => void;
  updateTool: (tool: Tool) => void;
  deleteTool: (id: string) => void;
  addLoan: (loan: Omit<Loan, "id" | "status">) => void;
  returnTool: (loanId: string) => void;
}

/* Estado inicial para ferramentas
const initialTools: Tool[] = [
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
];

// Estado inicial para empréstimos
const initialLoans: Loan[] = [
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
];*/

export const ToolsContext = createContext<ToolsContextType | undefined>(undefined);

export function ToolsProvider({ children }: { children: ReactNode }) {
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [loans, setLoans] = useState<Loan[]>(initialLoans);

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
    const newLoan: Loan = {
      ...loan,
      id: Math.random().toString(36).substr(2, 9),
      status: "active" as const,
    };
    
    setTools(updatedTools);
    setLoans([...loans, newLoan]);
  };

  const returnTool = (loanId: string) => {
    // Encontrar o empréstimo
    const loan = loans.find((l) => l.id === loanId);
    if (!loan || loan.status !== "active") return;

    // Atualizar o empréstimo com a data e hora atual de devolução
    const updatedLoans = loans.map((l) =>
      l.id === loanId
        ? { ...l, status: "returned" as const, returnDate: new Date() }
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
    <ToolsContext.Provider
      value={{
        tools,
        loans,
        setTools,
        setLoans,
        addTool,
        updateTool,
        deleteTool,
        addLoan,
        returnTool
      }}
    >
      {children}
    </ToolsContext.Provider>
  );
}

export const useTools = () => {
  const context = useContext(ToolsContext);
  if (context === undefined) {
    throw new Error("useTools must be used within a ToolsProvider");
  }
  return context;
};
