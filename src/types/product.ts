/**
 * Skincare product categories
 */
export type ProductCategory =
  | 'cleanser'
  | 'toner'
  | 'serum'
  | 'moisturizer'
  | 'sunscreen'
  | 'masks_treatments'
  | 'essence'
  | 'eye_cream'
  | 'facial_oil'
  | 'exfoliant'
  | 'mask'
  | 'treatment'
  | 'other';

/**
 * Standard application order weights (thinnest to thickest)
 * Cleanser (1) -> Toner (2) -> Serum (3) -> Moisturizer (4) -> Sunscreen (5) -> Masks & Treatments (6)
 */
export const CATEGORY_ORDER_WEIGHTS: Record<ProductCategory, number> = {
  cleanser: 1,
  toner: 2,
  essence: 2.5,
  serum: 3,
  eye_cream: 3.5,
  moisturizer: 4,
  facial_oil: 4.5,
  sunscreen: 5,
  masks_treatments: 6,
  mask: 6,
  treatment: 6,
  exfoliant: 2.5,
  other: 7,
};

/**
 * Available categories in Cabinet UI
 */
export interface CategoryDefinition {
  key: ProductCategory;
  label: string;
  orderWeight: number;
  icon: string;
  shortDescription: string;
}

export const PRIMARY_CATEGORIES: CategoryDefinition[] = [
  { key: 'cleanser', label: 'Cleanser', orderWeight: 1, icon: '🫧', shortDescription: 'Step 1 • Water/Gel wash' },
  { key: 'toner', label: 'Toner', orderWeight: 2, icon: '💧', shortDescription: 'Step 2 • Watery mist/liquid' },
  { key: 'serum', label: 'Serum', orderWeight: 3, icon: '🧪', shortDescription: 'Step 3 • Lightweight active' },
  { key: 'moisturizer', label: 'Moisturizer', orderWeight: 4, icon: '🧴', shortDescription: 'Step 4 • Cream/Emulsion' },
  { key: 'sunscreen', label: 'Sunscreen', orderWeight: 5, icon: '☀️', shortDescription: 'Step 5 • UV protection shield' },
  { key: 'masks_treatments', label: 'Masks & Treatments', orderWeight: 6, icon: '✨', shortDescription: 'Special care & overnight mask' },
];

/**
 * Routine allocation options
 */
export type RoutineType = 'am' | 'pm' | 'both';

/**
 * Core Skincare Product Interface
 */
export interface Product {
  /** Unique product identifier */
  id: string;
  /** Product display name (e.g. "Gentle Foaming Cleanser") */
  name: string;
  /** Skincare category for application sorting */
  category: ProductCategory | string;
  /** Date the product was opened / started (ISO string or YYYY-MM-DD) */
  openedDate: string;
  /** Optional brand / manufacturer (e.g. "CeraVe") */
  brand?: string;
  /** Which routine(s) this product belongs to */
  routineType?: RoutineType;
  /** Numerical order weight (1: thinnest -> 6: thickest/special) */
  orderWeight?: number;
  /** Period After Opening (PAO) in months before expiry (e.g., 6, 12) */
  periodAfterOpeningMonths?: number;
  /** Calculated or user-provided expiration date (YYYY-MM-DD) */
  expirationDate?: string;
  /** Optional user notes or usage instructions */
  notes?: string;
  /** Record creation timestamp */
  createdAt?: number;
  /** Record last update timestamp */
  updatedAt?: number;
}

/**
 * Input payload for adding a new product
 */
export type CreateProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

/**
 * Input payload for updating an existing product
 */
export type UpdateProductInput = Partial<Omit<Product, 'id' | 'createdAt'>> & {
  id: string;
};
