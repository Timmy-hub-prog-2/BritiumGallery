export interface Address {
  houseNumber: string;
  wardName: string;
  street: string;
  township: string;
  city: string;
  state: string;
  country:string;
   latitude?: number;
  longitude?: number;
}

export interface People {
  id: number;
  name: string;
  email: string;
  gender: string;
  phoneNumber: string;
  address: Address;
  profilePic?: string;
  customerType?: string;
  roleName?: string;
   isOnline?: boolean; 
  lastSeenAt?: string;
}
