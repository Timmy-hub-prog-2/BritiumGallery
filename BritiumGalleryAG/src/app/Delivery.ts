export interface Delivery {
  id?: number;
  
  // New fields for the updated structure
  deliveryType?: string; // standard, express, ship, etc.
  speedType?: string; // normal, fast, etc.
  baseDelayDays?: number; // Base delay in days
  baseDelayHours?: number; // Base delay in hours
  speedKmHr?: number; // Speed in km/hr
  feePerKm?: number; // Fee per km in MMK
  baseFee?: number; // Base fee in MMK
  maxFee?: number; // Maximum fee in MMK
  
  // Legacy fields for backward compatibility
  type: 'STANDARD' | 'EXPRESS' | 'SHIP';
  name: string;
  adminId: number; 
  feesPer1km?: number | null; // Allow null as well
  fixAmount?: number | null; // Allow null as well
  minDelayTime?: string | null;
  
  // Removed fields (no longer needed)
  // shopLat?: number;
  // shopLng?: number;
  // shopAddressId?: number;
  // shopUserId?: number;
}

export interface DeliveryFeeRequestDTO {
  userId: number;
  deliveryId?: number; // Optional now since we can calculate without specific delivery
  method?: string; // Optional - can be determined automatically
  name?: string; // Optional - can be determined automatically
}

export interface DeliveryFeeResponseDTO {
  fee: number;            // The calculated delivery fee
  distance: number;       // The distance between the user and the shop
  estimatedTime: string;  // Estimated delivery time
  suggestedMethod?: string; // Suggested delivery method
}
