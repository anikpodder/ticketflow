import { getRefundProvider } from "./payment.factory";

import { PaymentProviderName, RefundRequest } from "./payment.types";

export async function processRefund(
  providerName: PaymentProviderName,
  request: RefundRequest
) {
  const provider = getRefundProvider(providerName);

  return await provider.refundPayment(request);
}
