import {
  PaymentProvider,
  PaymentRequest,
  PaymentResult,
} from "./payment.types";

export class MockPayPalProvider implements PaymentProvider {
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      success: true,
      provider: "MOCK_PAYPAL",
      transactionId: `paypal_${request.idempotencyKey}`,
      message: "Mock PayPal payment successful.",
    };
  }
}
