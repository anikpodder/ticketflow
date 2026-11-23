import { RefundProvider, RefundRequest, RefundResult } from "./payment.types";

export class MockPayPalRefundProvider implements RefundProvider {
  async refundPayment(request: RefundRequest): Promise<RefundResult> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      success: true,
      provider: "MOCK_PAYPAL",
      refundId: `paypal_refund_${request.idempotencyKey}`,
      message: "Mock PayPal refund successful.",
    };
  }
}
