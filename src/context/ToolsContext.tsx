
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Tool, Loan, ToolCategory, Employee } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ToolsContextType {
  tools: Tool[];
  loans: Loan[];
  employees: Employee[];
  setTools: (tools: Tool[]) => void;
  setLoans: (loans: Loan[]) => void;
  setEmployees: (employees: Employee[]) => void;
  addTool: (tool: Omit<Tool, "id">) => void;
  updateTool: (tool: Tool) => void;
  deleteTool: (id: string) => void;
  addLoan: (loan: Omit<Loan, "id" | "status">) => void;
  returnTool: (loanId: string) => void;
  addEmployee: (employee: Omit<Employee, "id">) => void;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;
  isLoading: boolean;
}

export const ToolsContext = createContext<ToolsContextType | undefined>(undefined);

export function ToolsProvider({ children }: { children: ReactNode }) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data from Supabase
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch tools
        const { data: toolsData, error: toolsError } = await supabase
          .from('tools')
          .select('*');
        
        if (toolsError) throw toolsError;
        
        // Map tools data to our format
        const mappedTools = toolsData.map(tool => ({
          id: tool.id,
          name: tool.name,
          category: tool.category as ToolCategory,
          quantity: tool.quantity,
          available: tool.available
        }));
        
        setTools(mappedTools);
        
        // Fetch loans
        const { data: loansData, error: loansError } = await supabase
          .from('loans')
          .select('*');
          
        if (loansError) throw loansError;
        
        // Map loans data to our format
        const mappedLoans = loansData.map(loan => ({
          id: loan.id,
          toolId: loan.tool_id,
          toolName: loan.tool_name,
          borrower: loan.borrower,
          role: loan.role || "",
          isThirdParty: loan.is_third_party,
          borrowDate: new Date(loan.borrow_date),
          expectedReturnDate: loan.expected_return_date ? new Date(loan.expected_return_date) : null,
          returnDate: loan.return_date ? new Date(loan.return_date) : null,
          status: loan.status as "active" | "returned",
          employeeId: loan.employee_id || null
        }));
        
        setLoans(mappedLoans);
        
        // Fetch employees
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('*');
        
        if (employeesError) throw employeesError;
        
        // Map employees data to our format
        const mappedEmployees = employeesData.map(employee => ({
          id: employee.id,
          name: employee.name,
          role: employee.role
        }));
        
        setEmployees(mappedEmployees);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const addTool = async (tool: Omit<Tool, "id">) => {
    try {
      const { data, error } = await supabase
        .from('tools')
        .insert([{
          name: tool.name,
          category: tool.category,
          quantity: tool.quantity,
          available: tool.quantity
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      const newTool: Tool = {
        id: data.id,
        name: data.name,
        category: data.category as ToolCategory,
        quantity: data.quantity,
        available: data.available
      };
      
      setTools([...tools, newTool]);
      toast.success('Ferramenta adicionada com sucesso');
    } catch (error) {
      console.error('Error adding tool:', error);
      toast.error('Erro ao adicionar ferramenta');
    }
  };

  const updateTool = async (updatedTool: Tool) => {
    try {
      const { error } = await supabase
        .from('tools')
        .update({
          name: updatedTool.name,
          category: updatedTool.category,
          quantity: updatedTool.quantity,
          available: updatedTool.available
        })
        .eq('id', updatedTool.id);
      
      if (error) throw error;
      
      setTools(tools.map((tool) => (tool.id === updatedTool.id ? updatedTool : tool)));
      toast.success('Ferramenta atualizada com sucesso');
    } catch (error) {
      console.error('Error updating tool:', error);
      toast.error('Erro ao atualizar ferramenta');
    }
  };

  const deleteTool = async (id: string) => {
    try {
      // Check for active loans
      const hasActiveLoans = loans.some(
        (loan) => loan.toolId === id && loan.status === "active"
      );
      
      if (hasActiveLoans) {
        toast.error('Não é possível excluir uma ferramenta com empréstimos ativos');
        return;
      }
      
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setTools(tools.filter((tool) => tool.id !== id));
      // Remove related loans from local state
      setLoans(loans.filter((loan) => loan.toolId !== id));
      toast.success('Ferramenta excluída com sucesso');
    } catch (error) {
      console.error('Error deleting tool:', error);
      toast.error('Erro ao excluir ferramenta');
    }
  };

  const addLoan = async (loan: Omit<Loan, "id" | "status">) => {
    try {
      // Find the tool
      const tool = tools.find((t) => t.id === loan.toolId);
      if (!tool || tool.available <= 0) {
        toast.error('Ferramenta não disponível para empréstimo!');
        return;
      }

      // Set 10-hour expected return date (8:00-18:00)
      let expectedReturnDate = loan.expectedReturnDate;
      
      if (!loan.isThirdParty) {
        // For employees, set expected return to same day at 18:00
        const borrowDate = new Date(loan.borrowDate);
        expectedReturnDate = new Date(borrowDate);
        expectedReturnDate.setHours(18, 0, 0, 0);
        
        // If borrowed after 18:00, set to next day at 18:00
        if (borrowDate.getHours() >= 18) {
          expectedReturnDate.setDate(expectedReturnDate.getDate() + 1);
        }
      }

      // Insert into database
      const { data, error } = await supabase
        .from('loans')
        .insert([{
          tool_id: loan.toolId,
          tool_name: tool.name,
          borrower: loan.borrower,
          role: loan.role || "",
          is_third_party: loan.isThirdParty,
          borrow_date: loan.borrowDate.toISOString(),
          expected_return_date: expectedReturnDate?.toISOString() || null,
          employee_id: loan.employeeId || null,
          status: "active"
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update tool availability
      const updatedTool = { ...tool, available: tool.available - 1 };
      await updateTool(updatedTool);
      
      // Add new loan to state
      const newLoan: Loan = {
        id: data.id,
        toolId: data.tool_id,
        toolName: data.tool_name,
        borrower: data.borrower,
        role: data.role || "",
        isThirdParty: data.is_third_party,
        borrowDate: new Date(data.borrow_date),
        expectedReturnDate: data.expected_return_date ? new Date(data.expected_return_date) : null,
        returnDate: null,
        status: "active",
        employeeId: data.employee_id || null
      };
      
      setLoans([...loans, newLoan]);
      toast.success('Empréstimo registrado com sucesso');
    } catch (error) {
      console.error('Error adding loan:', error);
      toast.error('Erro ao registrar empréstimo');
    }
  };

  const returnTool = async (loanId: string) => {
    try {
      // Find the loan
      const loan = loans.find((l) => l.id === loanId);
      if (!loan || loan.status !== "active") {
        toast.error('Empréstimo não encontrado ou já devolvido');
        return;
      }
      
      const returnDate = new Date();
      
      // Update loan in database
      const { error: loanError } = await supabase
        .from('loans')
        .update({
          return_date: returnDate.toISOString(),
          status: "returned"
        })
        .eq('id', loanId);
      
      if (loanError) throw loanError;
      
      // Find the tool and update availability
      const tool = tools.find((t) => t.id === loan.toolId);
      if (tool) {
        const updatedTool = { ...tool, available: tool.available + 1 };
        
        const { error: toolError } = await supabase
          .from('tools')
          .update({ available: updatedTool.available })
          .eq('id', updatedTool.id);
        
        if (toolError) throw toolError;
        
        setTools(tools.map(t => t.id === updatedTool.id ? updatedTool : t));
      }
      
      // Update loan in state
      setLoans(loans.map(l => 
        l.id === loanId 
          ? { ...l, status: "returned", returnDate: returnDate } 
          : l
      ));
      
      toast.success('Devolução registrada com sucesso');
    } catch (error) {
      console.error('Error returning tool:', error);
      toast.error('Erro ao registrar devolução');
    }
  };

  // Employee management functions
  const addEmployee = async (employee: Omit<Employee, "id">) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          name: employee.name,
          role: employee.role
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      const newEmployee: Employee = {
        id: data.id,
        name: data.name,
        role: data.role
      };
      
      setEmployees([...employees, newEmployee]);
      toast.success('Funcionário adicionado com sucesso');
      return newEmployee;
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Erro ao adicionar funcionário');
      return null;
    }
  };

  const updateEmployee = async (employee: Employee) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          name: employee.name,
          role: employee.role
        })
        .eq('id', employee.id);
      
      if (error) throw error;
      
      setEmployees(employees.map(e => e.id === employee.id ? employee : e));
      toast.success('Funcionário atualizado com sucesso');
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Erro ao atualizar funcionário');
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      // Check for loans associated with this employee
      const hasLoans = loans.some(loan => loan.employeeId === id && loan.status === 'active');
      
      if (hasLoans) {
        toast.error('Não é possível excluir um funcionário com empréstimos ativos');
        return;
      }
      
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setEmployees(employees.filter(e => e.id !== id));
      toast.success('Funcionário excluído com sucesso');
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Erro ao excluir funcionário');
    }
  };

  return (
    <ToolsContext.Provider
      value={{
        tools,
        loans,
        employees,
        setTools,
        setLoans,
        setEmployees,
        addTool,
        updateTool,
        deleteTool,
        addLoan,
        returnTool,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        isLoading
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
