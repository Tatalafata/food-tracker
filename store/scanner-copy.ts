import type { Language } from '@/store/i18n';

export const scannerCopy: Record<Language, {
  enterCode: string; lookUp: string; notFound: string; unavailable: string; cameraError: string;
  expiryHint: string; removeDate: string;
}> = {
  it: {
    enterCode: 'Inserisci il codice a barre', lookUp: 'Cerca prodotto',
    notFound: 'Prodotto assente dal catalogo. Puoi scrivere il nome qui sotto.',
    unavailable: 'Il catalogo non risponde. Puoi scrivere il nome qui sotto.',
    cameraError: 'Fotocamera non disponibile. Puoi digitare il codice stampato sotto le barre.',
    expiryHint: 'Scegli la data stampata sulla confezione. Puoi lasciare il campo vuoto.', removeDate: 'Rimuovi la data',
  },
  en: {
    enterCode: 'Enter barcode', lookUp: 'Look up product',
    notFound: 'Product missing from the catalog. You can enter its name below.',
    unavailable: 'The catalog is unavailable. You can enter the product name below.',
    cameraError: 'Camera unavailable. You can type the number printed under the barcode.',
    expiryHint: 'Choose the date printed on the package. You can leave this field blank.', removeDate: 'Remove date',
  },
  fr: {
    enterCode: 'Saisir le code-barres', lookUp: 'Rechercher le produit',
    notFound: 'Produit absent du catalogue. Vous pouvez saisir son nom ci-dessous.',
    unavailable: 'Le catalogue est indisponible. Vous pouvez saisir le nom du produit ci-dessous.',
    cameraError: 'Caméra indisponible. Vous pouvez saisir le numéro imprimé sous les barres.',
    expiryHint: 'Choisissez la date imprimée sur l’emballage. Vous pouvez laisser ce champ vide.', removeDate: 'Supprimer la date',
  },
  de: {
    enterCode: 'Barcode eingeben', lookUp: 'Produkt suchen',
    notFound: 'Produkt fehlt im Katalog. Du kannst den Namen unten eingeben.',
    unavailable: 'Der Katalog ist nicht erreichbar. Du kannst den Produktnamen unten eingeben.',
    cameraError: 'Kamera nicht verfügbar. Du kannst die Nummer unter dem Barcode eingeben.',
    expiryHint: 'Wähle das Datum auf der Verpackung. Du kannst das Feld leer lassen.', removeDate: 'Datum entfernen',
  },
};
