
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
  createdAt: Date;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  createdAt: Date;
}

export interface ThirdParty {
  companyName: string;
  employeeName: string;
  contactInfo?: string;
}

export interface Loan {
  id: string;
  toolId: string;
  toolName: string;
  borrower: string;
  role?: string;
  isThirdParty: boolean;
  borrowDate: Date;
  expectedReturnDate?: Date | null;
  returnDate?: Date | null;
  status: "active" | "returned";
  employeeId?: string | null;
}

export interface LoanWithToolData {
  id: string;
  toolId: string;
  toolName: string;
  borrower: string;
  role?: string;
  borrowDate: Date;
  expectedReturnDate?: Date | null;
  returnDate?: Date | null;
  status: string;
  isThirdParty: boolean;
}
