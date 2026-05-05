export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Utensils',
  'Grocery',
  'Food',
  'Health',
  'Others',
];

export function categoryToSlug(category) {
  return category.toLowerCase();
}
