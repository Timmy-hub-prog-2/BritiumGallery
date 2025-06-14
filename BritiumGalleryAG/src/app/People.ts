export interface Address {
  houseNumber: string;
  wardName: string;
  street: string;
  township: string;
  city: string;
  state: string;
}

export interface People {
  id: number;
  name: string;
  email: string;
  gender: string;
  phoneNumber: string;
  address: Address; // ✅ should NOT be a string
}
