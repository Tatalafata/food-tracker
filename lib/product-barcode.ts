export function normalizeProductBarcode(raw: string, type?: string): string | null {
  let code = raw.replace(/\s+/g, '');
  if (!/^\d{4,14}$/.test(code)) return null;

  // UPC-E compresses a GTIN-12. Only expand when the scanner identifies that symbology.
  if (type === 'upc_e' && /^[01]\d{7}$/.test(code)) {
    const [system, a, b, c, d, e, marker, check] = code;
    if ('012'.includes(marker)) code = `${system}${a}${b}${marker}0000${c}${d}${e}${check}`;
    else if (marker === '3') code = `${system}${a}${b}${c}00000${d}${e}${check}`;
    else if (marker === '4') code = `${system}${a}${b}${c}${d}00000${e}${check}`;
    else code = `${system}${a}${b}${c}${d}${e}0000${marker}${check}`;
  }

  code = code.replace(/^0+/, '');
  if (code.length === 0) return null;
  return code.padStart(code.length <= 8 ? 8 : 13, '0');
}

type ProductLookup = { name: string; lookup: 'found' | 'notFound' | 'unavailable' };

export async function lookupProductBarcode(code: string, language: string, signal: AbortSignal, native: boolean): Promise<ProductLookup> {
  const localName = `product_name_${language}`;
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,${localName}`, {
    signal,
    headers: native ? { 'User-Agent': 'MakeItDinner/1.0.3 (https://github.com/Tatalafata/food-tracker)' } : undefined,
  });
  if (response.status === 404) return { name: '', lookup: 'notFound' };
  if (!response.ok) return { name: '', lookup: 'unavailable' };

  const { product, status } = await response.json();
  const name = status === 1
    ? [product?.[localName], product?.product_name].find(value => typeof value === 'string' && value.trim())?.trim()
    : '';
  return name ? { name, lookup: 'found' } : { name: '', lookup: 'notFound' };
}
