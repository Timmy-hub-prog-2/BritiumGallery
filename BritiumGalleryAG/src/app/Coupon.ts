export interface Coupon {
  id?: number;
  code: string;
  type: string;
  discount: string;
  status?: string;
 
  startDate?: string;  // Make startDate optional
  endDate?: string;    // Make endDate optional
}
