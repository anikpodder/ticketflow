import { getPaymentProvider } from "./payment.factory";
import { PaymentProviderName, PaymentRequest } from "./payment.types";

export async function processPayment(
  providerName: PaymentProviderName,
  request: PaymentRequest
) {
  const provider = getPaymentProvider(providerName);

  return await provider.processPayment(request);
}
