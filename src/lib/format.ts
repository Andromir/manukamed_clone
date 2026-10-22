const eur = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR' });

export function formatPrice(value: number) {
  return eur.format(value);
}

export function pluralizeItems(count: number) {
  const mod = count % 100;
  if (mod === 1) return `${count} izdelek`;
  if (mod === 2) return `${count} izdelka`;
  if (mod === 3 || mod === 4) return `${count} izdelki`;
  return `${count} izdelkov`;
}
