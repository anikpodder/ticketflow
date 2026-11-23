import { RefundProvider, RefundRequest, RefundResult } from "./payment.types";

export class MockStripeRefundProvider implements RefundProvider {
  async refundPayment(request: RefundRequest): Promise<RefundResult> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      provider: "MOCK_STRIPE",
      refundId: `stripe_refund_${request.idempotencyKey}`,
      message: "Mock Stripe refund successful.",
    };
  }
}
