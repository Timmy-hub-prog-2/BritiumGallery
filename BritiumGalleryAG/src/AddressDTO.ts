export interface AddressDTO {
  id?: number;
  userId?: number;
  country: string;
  state: string;
  city: string;
  township: string;
  postalCode?: string;
  street: string;
  houseNumber: string;
  wardName: string;
  latitude?: number;
  longitude?: number;
  mainAddress?: boolean;
}