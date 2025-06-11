export class ShopAddressDTO {
  id?: number;
  country: string | undefined;
  state: string | undefined;
  city: string | undefined;
  township: string | undefined;
  postalCode: string | undefined;
  street: string | undefined;
  houseNumber: string | undefined;
  wardName: string | undefined;
  latitude?: number;
  longitude?: number;
  mainAddress?: boolean;
  userId: number | undefined;
}