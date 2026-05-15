/**
 * Badge text for product discounts. Flat amounts show stored discountPercentage in parentheses when present.
 */
export function formatProductOffLabel(product) {
  const discountType = product?.discountType;
  const discountValue = Number.isFinite(Number(product?.discountValue)) ? Number(product.discountValue) : 0;
  const discountPercentage = Number.isFinite(Number(product?.discountPercentage))
    ? Number(product.discountPercentage)
    : 0;

  if (discountType === 'flat') {
    const base = `৳${discountValue.toFixed(0)} off`;
    if (discountPercentage > 0) {
      const pct =
        Math.abs(discountPercentage - Math.round(discountPercentage)) < 1e-6
          ? String(Math.round(discountPercentage))
          : discountPercentage.toFixed(1);
      return `${base} (${pct}%)`;
    }
    return base;
  }
  if (discountType === 'percentage' || discountPercentage > 0) {
    return `${discountPercentage > 0 ? discountPercentage.toFixed(0) : discountValue.toFixed(0)}% off`;
  }
  return '';
}
