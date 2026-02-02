export interface PaystackWebhookPayload {
 event: string;
 data: {
  reference: string;
  amount: number;
  status: string;
  paid_at?: string;
  metadata?: {
   orderId: string;
   userId: string;
  };
  customer?: {
   email: string;
   customer_code?: string;
  };
  authorization?: {
   authorization_code: string;
   card_type: string;
   last4: string;
   exp_month: string;
   exp_year: string;
   bank: string;
  };
 };
}