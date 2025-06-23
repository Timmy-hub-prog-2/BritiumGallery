export interface Delivery {
  id?: number;
  type: 'STANDARD' | 'EXPRESS' | 'SHIP';
  name: string;
  adminId: number; 
  feesPer1km?: number | null; // Allow null as well
  fixAmount?: number | null; // Allow null as well
  minDelayTime?: string;
    shopLat?: number;
  shopLng?: number;
 shopAddressId?: number;


}
export interface DeliveryFeeRequestDTO {
  userId: number;
  deliveryId: number;
  method: string;
  name: string;
}


export interface DeliveryFeeResponseDTO {
  fee: number;            // The calculated delivery fee
  distance: number;       // The distance between the user and the shop
  estimatedTime: string; 
  suggestedMethod?: string; // Estimated delivery time
}
