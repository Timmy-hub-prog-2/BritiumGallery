export interface Coupon {
  id?: number;
  code: string;
  type: string;
  discount: string;
  status?: string;
 
  startDate?: string;  
  endDate?: string;
  rules?: CustomerRule[];  
}

export interface CustomerRule {
  customerTypeId: number;
  times: number;
}
