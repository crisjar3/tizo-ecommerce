import { resolveProductImage } from './product-image';

describe('resolveProductImage', () => {
  it('keeps usable official URLs', () => {
    expect(resolveProductImage('product-001', 'https://cdn.example.com/product.jpg')).toBe(
      'https://cdn.example.com/product.jpg',
    );
  });

  it('replaces placeholder and malformed URLs with deterministic local assets', () => {
    expect(resolveProductImage('product-004', 'https://images.example.test/product-004.jpg')).toBe(
      '/assets/products/running-shoe.jpg',
    );
    expect(resolveProductImage('unknown', 'http://[invalid')).toBe('/assets/products/shirt.jpg');
  });
});
