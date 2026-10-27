/*
 * PSYCHE MIRROR — site configuration.
 *
 * stripePaymentLink: an optional Stripe Payment Link for pay-what-you-want
 * support, e.g. "https://buy.stripe.com/xxxxxxxxxxxx". Create one in the
 * Stripe Dashboard (Payment Links -> "Let customers choose what to pay").
 *
 * It is only a link: no Stripe keys, no Stripe.js and no data about your
 * answers ever go to Stripe. Leave it empty and the support box stays hidden.
 */
window.PSYCHE_CONFIG = {
  stripePaymentLink: ''
};
