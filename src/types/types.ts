
export enum ToolCategory {
  ELECTRIC = "Elétrica",
  MANUAL = "Manual",
  DIAGNOSTIC = "Diagnóstico"
}

export interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  quantity: number;
  available: number;
}

export interface Loan {
  id: string;
  toolId: string;
  toolName: string;
  borrower: string;
  role: string; // Função do funcionário (mecânico/eletricista) ou vazio para terceiros
  isThirdParty: boolean;
  borrowDate: Date;
  expectedReturnDate: Date;
  returnDate: Date | null;
  status: "active" | "returned";
}
