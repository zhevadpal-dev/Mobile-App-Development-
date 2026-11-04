import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Product,
  CreateProductInput,
  ProductCategory,
  CATEGORY_ORDER_WEIGHTS,
} from '../types/product';

const PRODUCTS_STORAGE_KEY = '@skin_diary_products';

/**
 * Generate a unique product ID
 */
const generateId = (): string => {
  return 'prod_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
};

/**
 * Automatically determine order weight based on category if not explicitly provided
 */
const resolveOrderWeight = (category: string, explicitWeight?: number): number => {
  if (typeof explicitWeight === 'number' && !isNaN(explicitWeight)) {
    return explicitWeight;
  }
  const normalized = category.toLowerCase().trim() as ProductCategory;
  return CATEGORY_ORDER_WEIGHTS[normalized] ?? 9;
};

/**
 * Retrieve all products from AsyncStorage
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const raw = await AsyncStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error fetching products from AsyncStorage:', error);
    return [];
  }
};

/**
 * Retrieve a single product by ID
 */
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const products = await getProducts();
    const found = products.find(p => p.id === id);
    return found ?? null;
  } catch (error) {
    console.error(`Error fetching product with id ${id}:`, error);
    return null;
  }
};

/**
 * Add a new product to AsyncStorage
 */
export const addProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    const now = Date.now();
    const newProduct: Product = {
      ...input,
      id: input.id || generateId(),
      orderWeight: resolveOrderWeight(input.category, input.orderWeight),
      createdAt: now,
      updatedAt: now,
    };

    const currentProducts = await getProducts();
    const updatedProducts = [newProduct, ...currentProducts];

    await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedProducts));
    return newProduct;
  } catch (error) {
    console.error('Error adding product to AsyncStorage:', error);
    throw error;
  }
};

/**
 * Update an existing product in AsyncStorage
 */
export const updateProduct = async (
  id: string,
  updates: Partial<Omit<Product, 'id' | 'createdAt'>>
): Promise<Product> => {
  try {
    const currentProducts = await getProducts();
    const productIndex = currentProducts.findIndex(p => p.id === id);

    if (productIndex === -1) {
      throw new Error(`Product with ID "${id}" was not found.`);
    }

    const existing = currentProducts[productIndex];
    const category = updates.category ?? existing.category;
    const orderWeight =
      updates.orderWeight !== undefined
        ? updates.orderWeight
        : updates.category
        ? resolveOrderWeight(updates.category)
        : existing.orderWeight;

    const updatedProduct: Product = {
      ...existing,
      ...updates,
      category,
      orderWeight,
      updatedAt: Date.now(),
    };

    currentProducts[productIndex] = updatedProduct;
    await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(currentProducts));

    return updatedProduct;
  } catch (error) {
    console.error(`Error updating product with id ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a product by ID from AsyncStorage
 */
export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    const currentProducts = await getProducts();
    const filtered = currentProducts.filter(p => p.id !== id);

    if (filtered.length === currentProducts.length) {
      return false; // No product was removed
    }

    await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error(`Error deleting product with id ${id}:`, error);
    throw error;
  }
};

/**
 * Overwrite all products in AsyncStorage (useful for batch sync or test fixtures)
 */
export const saveAllProducts = async (products: Product[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Error saving all products to AsyncStorage:', error);
    throw error;
  }
};

/**
 * Clear all products from AsyncStorage
 */
export const clearAllProducts = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PRODUCTS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing products from AsyncStorage:', error);
    throw error;
  }
};
