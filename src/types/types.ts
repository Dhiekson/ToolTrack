
export interface Tool {
  id: string;
  name: string;
  category: string;
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
