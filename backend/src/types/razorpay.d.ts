declare module 'razorpay' {
  import { Request } from 'express';

  interface RazorpayConfig {
    key_id: string;
    key_secret: string;
  }

  interface OrderCreateOptions {
    amount: number;
    currency: string;
    receipt?: string;
    notes?: any;
  }

  interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    notes: any;
    created_at: number;
  }

  class Razorpay {
    constructor(config: RazorpayConfig);
    orders: {
      create(options: OrderCreateOptions): Promise<RazorpayOrder>;
      fetch(orderId: string): Promise<RazorpayOrder>;
    };
    payments: {
      fetch(paymentId: string): Promise<any>;
      capture(paymentId: string, amount: number, currency: string): Promise<any>;
    };
  }

  export default Razorpay;
}
