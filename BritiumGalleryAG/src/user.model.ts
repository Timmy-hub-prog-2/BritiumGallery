export interface AddressDTO {
  id: number;
  city: string;
  township: string;
  street: string;
  houseNumber: string;
  wardName: string;
  latitude: number;
  longitude: number;
  state?: string;
  country?: string;
  postalCode?: string;
  userId?: number;
  mainAddress?: boolean;
}

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
  address?: string;
  customerType?: string;
  totalSpend?: number;
}

