const fallbackByProductId: Readonly<Record<string, string>> = {
  'product-001': '/assets/products/shirt.jpg',
  'product-002': '/assets/products/headphones.jpg',
  'product-003': '/assets/products/jacket.jpg',
  'product-004': '/assets/products/running-shoe.jpg',
};

export function resolveProductImage(productId: string, imageUrl: string): string {
  try {
    const url = new URL(imageUrl, window.location.origin);
    if (url.hostname !== 'images.example.test') return imageUrl;
  } catch {
    // A malformed external value must never break rendering.
  }

  return fallbackByProductId[productId] ?? '/assets/products/shirt.jpg';
}
