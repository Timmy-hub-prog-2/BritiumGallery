export interface User {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  imageUrls: string[];
  gender?: string;
  status?: number;
  roleId: number;
}

