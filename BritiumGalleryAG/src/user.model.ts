export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  imageUrls: string[];
  gender?: string;
  status?: number;
  roleId: number;
  address?:string;
  customerType?: string;
  totalSpend?: number;
}

