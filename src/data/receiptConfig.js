export const DEFAULT_RECEIPT_CONFIG = {
  subtitle: "Sales Invoice / Cash Slip",
  tagline: "",
  address: "",
  phone: "",
  footer_line1: "Thank you for shopping at {store}!",
  footer_line2: "",
  show_receipt_no: true,
  show_address_field: true,
};

/**
 * Replaces placeholders like {store} with the actual store name
 */
export function formatReceiptText(text, storeName = "My Store") {
  if (!text) return "";
  return text.replace(/\{store\}/gi, storeName);
}
