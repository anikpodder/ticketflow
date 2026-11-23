export type PaymentProviderName = "MOCK_STRIPE" | "MOCK_PAYPAL";

export type PaymentRequest = {
  bookingId: string;
  amount: number;
  idempotencyKey: string;
};

export type PaymentResult = {
  success: boolean;
  provider: PaymentProviderName;
  transactionId: string;
  message: string;
};

export interface PaymentProvider {
  processPayment(request: PaymentRequest): Promise<PaymentResult>;
}

export type RefundRequest = {
  bookingId: string;
  paymentId: string;
  amount: number;
  idempotencyKey: string;
};

export type RefundResult = {
  success: boolean;
  provider: PaymentProviderName;
  refundId: string;
  message: string;
};

export interface RefundProvider {
  refundPayment(request: RefundRequest): Promise<RefundResult>;
}
