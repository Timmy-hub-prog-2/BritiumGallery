export interface Coupon {
  id?: number;
  code: string;
  type: string;
  discount: string;
  status?: string;
 
  startDate?: string;  
  endDate: string | null;
  rules?: CustomerRule[];  
}

export interface CustomerRule {
  customerTypeId: number;
  times: number;
}
