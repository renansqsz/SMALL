export type AuthUser = {
  id: number;
  username: string;
};

export type SessionResponse = {
  user: AuthUser;
};

export type DashboardStats = {
  totalItems: number;
  inStock: number;
  outOfStock: number;
  totalEmployees: number;
  totalNotebooks: number;
  assignedItems: number;
};

export type Category = {
  id: number;
  name: string;
};

export type Equipment = {
  id: number;
  name: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  totalQuantity: number;
  availableQuantity: number;
  location: string;
  entryDate: string;
  status: string;
};

export type EquipmentHistoryItem = {
  id: number;
  equipmentId: number;
  equipmentName: string;
  employeeId: number;
  employeeName: string;
  office: string;
  quantity: number;
  movementType: string;
  createdAt: string;
};

export type Notebook = {
  id: number;
  brand: string;
  model: string;
  serialNumber: string;
  processor: string;
  gpu: string;
  screenSize: string;
  ramTotal: number;
  ramSticks: number;
  storageType: string;
  storageCapacity: string;
  condition: string;
  location: string;
  status: string;
  entryDate: string;
};

export type EmployeeAssignmentItem = {
  assignmentId: number;
  equipmentId: number;
  name: string;
  quantity: number;
  type: string;
};

export type EmployeeBase = {
  id: number;
  nome: string;
  escritorio: string;
};

export type Employee = EmployeeBase & {
  items: EmployeeAssignmentItem[];
};
