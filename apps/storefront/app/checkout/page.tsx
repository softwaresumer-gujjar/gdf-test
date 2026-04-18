import { CheckoutClient } from './ui/checkout-client';

export default function CheckoutPage() {
  return (
    <main className="container" style={{ paddingTop: 30 }}>
      <h1>Checkout</h1>
      <p>Submit cart to API and continue to Stripe checkout.</p>
      <CheckoutClient />
    </main>
  );
}
