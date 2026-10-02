import { getLocalDateKey } from "../data/demoSeed";

export { getLocalDateKey };

export const getOrderDateKey = (o) => {
  if (!o) return '';
  if (o.created_at) {
    const key = getLocalDateKey(o.created_at);
    if (key) return key;
  }
  if (o.raw_date) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(o.raw_date)) return o.raw_date;
    const key = getLocalDateKey(o.raw_date);
    if (key) return key;
  }
  return '';
};
