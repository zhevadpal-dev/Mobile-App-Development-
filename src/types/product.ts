/**
 * Skincare product categories
 */
export type ProductCategory =
  | 'cleanser'
  | 'toner'
  | 'essence'
  | 'serum'
  | 'eye_cream'
  | 'moisturizer'
  | 'facial_oil'
  | 'sunscreen'
  | 'exfoliant'
  | 'mask'
  | 'treatment'
  | 'other';

/**
 * Standard application order weights (1 = thinnest/first, 8+ = thickest/last)
 * Used to automatically order products in routine checklists
 */
export const CATEGORY_ORDER_WEIGHTS: Record<ProductCategory, number> = {
  cleanser: 1,
  toner: 2,
  essence: 3,
  serum: 4,
  eye_cream: 5,
  moisturizer: 6,
  facial_oil: 7,
  sunscreen: 8,
  exfoliant: 3,
  treatment: 4,
  mask: 5,
  other: 9,
};

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
  /** Numerical order weight (1: thinnest -> 8+: thickest) */
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
