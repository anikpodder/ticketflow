import {
  PaymentProvider,
  PaymentProviderName,
  RefundProvider,
} from "./payment.types";

import { MockStripeProvider } from "./mock-stripe.provider";
import { MockPayPalProvider } from "./mock-paypal.provider";

import { MockStripeRefundProvider } from "./mock-stripe.refund.provider";
import { MockPayPalRefundProvider } from "./mock-paypal.refund.provider";

export function getPaymentProvider(
  provider: PaymentProviderName
): PaymentProvider {
  switch (provider) {
    case "MOCK_STRIPE":
      return new MockStripeProvider();

    case "MOCK_PAYPAL":
      return new MockPayPalProvider();

    default:
      throw new Error("Unsupported payment provider");
  }
}

export function getRefundProvider(
  provider: PaymentProviderName
): RefundProvider {
  switch (provider) {
    case "MOCK_STRIPE":
      return new MockStripeRefundProvider();

    case "MOCK_PAYPAL":
      return new MockPayPalRefundProvider();

    default:
      throw new Error("Unsupported refund provider");
  }
}
