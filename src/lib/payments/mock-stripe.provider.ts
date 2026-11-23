import {
  PaymentProvider,
  PaymentRequest,
  PaymentResult,
} from "./payment.types";

export class MockStripeProvider implements PaymentProvider {
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      provider: "MOCK_STRIPE",
      transactionId: `stripe_${request.idempotencyKey}`,
      message: "Mock Stripe payment successful.",
    };
  }
}
