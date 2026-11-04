import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { TranslationKey } from '../constants/translations';
import { SPACING, RADIUS } from '../constants/theme';
import {
  Product,
  ProductCategory,
  PRIMARY_CATEGORIES,
  CATEGORY_ORDER_WEIGHTS,
} from '../types/product';
import {
  getProducts,
  addProduct,
  deleteProduct,
} from '../services/productStorage';

/**
 * Localized category label resolver
 */
export const getCategoryLabel = (category: string, t: (k: TranslationKey) => string): string => {
  const clean = category.toLowerCase();
  if (clean === 'all') return t('catAll');
  if (clean.includes('cleanse')) return t('catCleanser');
  if (clean.includes('tone')) return t('catToner');
  if (clean.includes('serum')) return t('catSerum');
  if (clean.includes('moistur')) return t('catMoisturizer');
  if (clean.includes('sun') || clean.includes('spf')) return t('catSunscreen');
  if (clean.includes('mask') || clean.includes('treat')) return t('catMasks');
  if (clean.includes('oil')) return t('catFacialOil');
  return category;
};

const SHORT_MONTH_KEYS: TranslationKey[] = [
  'monthJan', 'monthFeb', 'monthMar', 'monthApr', 'monthMay', 'monthJun',
  'monthJul', 'monthAug', 'monthSep', 'monthOct', 'monthNov', 'monthDec',
];

/**
 * Format ISO or YYYY-MM-DD date string into a subtle elegant display
 */
const formatOpenedDate = (dateStr: string, t: (key: TranslationKey) => string): string => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day)) {
        const monthName = t(SHORT_MONTH_KEYS[monthIndex]);
        return `${day} ${monthName} ${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const monthName = t(SHORT_MONTH_KEYS[d.getMonth()]);
      return `${d.getDate()} ${monthName} ${d.getFullYear()}`;
    }
  } catch {
    // fallback to original string
  }
  return dateStr;
};

/**
 * Get current date in YYYY-MM-DD format
 */
const getTodayFormatted = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Resolve display information for category
 */
const getCategoryMeta = (category: string) => {
  const found = PRIMARY_CATEGORIES.find(
    c => c.key === category.toLowerCase() || c.label.toLowerCase() === category.toLowerCase()
  );
  if (found) return found;

  const clean = category.toLowerCase();
  if (clean.includes('cleanse')) return PRIMARY_CATEGORIES[0];
  if (clean.includes('tone')) return PRIMARY_CATEGORIES[1];
  if (clean.includes('serum')) return PRIMARY_CATEGORIES[2];
  if (clean.includes('moistur')) return PRIMARY_CATEGORIES[3];
  if (clean.includes('sun') || clean.includes('spf')) return PRIMARY_CATEGORIES[4];
  if (clean.includes('mask') || clean.includes('treat')) return PRIMARY_CATEGORIES[5];

  return {
    key: 'other' as ProductCategory,
    label: category,
    orderWeight: 7,
    icon: '✨',
    shortDescription: 'Skincare Product',
  };
};

export default function CabinetScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [category, setCategory] = useState<ProductCategory>('cleanser');
  const [openedDate, setOpenedDate] = useState<string>(getTodayFormatted());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /**
   * Fetch products from AsyncStorage and sort automatically (thinnest to thickest)
   */
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getProducts();

      // Sort according to standard skincare application order:
      // Cleanser (1) -> Toner (2) -> Serum (3) -> Moisturizer (4) -> Sunscreen (5) -> Masks & Treatments (6)
      const sorted = [...data].sort((a, b) => {
        const weightA = a.orderWeight ?? getCategoryMeta(a.category).orderWeight;
        const weightB = b.orderWeight ?? getCategoryMeta(b.category).orderWeight;
        if (weightA !== weightB) {
          return weightA - weightB;
        }
        return a.name.localeCompare(b.name);
      });

      setProducts(sorted);
    } catch (error) {
      console.error('Failed to load products:', error);
      Alert.alert('Error', 'Unable to load products from storage.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /**
   * Reset Add Product Form
   */
  const resetForm = () => {
    setName('');
    setBrand('');
    setCategory('cleanser');
    setOpenedDate(getTodayFormatted());
  };

  /**
   * Handle Create Product Submission
   */
  const handleSaveProduct = async () => {
    if (!name.trim()) {
      Alert.alert(t('requiredField'), t('enterProductName'));
      return;
    }
    if (!openedDate.trim()) {
      Alert.alert(t('requiredField'), t('enterOpenedDate'));
      return;
    }

    try {
      setIsSubmitting(true);
      const meta = getCategoryMeta(category);

      await addProduct({
        name: name.trim(),
        brand: brand.trim() || undefined,
        category: meta.key,
        openedDate: openedDate.trim(),
        orderWeight: meta.orderWeight,
      });

      resetForm();
      setIsModalVisible(false);
      await loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert(t('saveFailed'), t('couldNotSaveProduct'));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle Delete Product
   */
  const handleDeleteProduct = (id: string, productName: string) => {
    Alert.alert(
      t('removeProductTitle'),
      `${productName} — ${t('removeProductConfirm')}`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(id);
              await loadProducts();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert(t('saveFailed'), t('failedToDeleteProduct'));
            }
          },
        },
      ]
    );
  };

  // Filter list
  const filterTabs = ['All', 'cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'masks_treatments'];

  const filteredProducts =
    selectedFilter === 'All'
      ? products
      : products.filter(p => {
          const meta = getCategoryMeta(p.category);
          return meta.key.toLowerCase() === selectedFilter.toLowerCase();
        });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.secondary }]}>
            {t('digitalCabinet')}
          </Text>
          <View style={styles.titleRow}>
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {t('cabinetTitle')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {products.length} {products.length === 1 ? t('productsCountSingle') : t('productsCountMulti')}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => setIsModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.addButtonText}>+ {t('addProduct')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsContainer}
        >
          {filterTabs.map(tab => {
            const isSelected = selectedFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected
                      ? colors.textPrimary
                      : isDark
                      ? '#242220'
                      : '#EFECE6',
                  },
                ]}
                onPress={() => setSelectedFilter(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pillText,
                    {
                      color: isSelected
                        ? colors.card
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {getCategoryLabel(tab, t)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Application Order Hint Banner */}
        <View
          style={[
            styles.orderBanner,
            {
              backgroundColor: isDark ? '#211D1A' : colors.primaryLight,
              borderColor: isDark ? '#382D26' : '#F4D8D0',
            },
          ]}
        >
          <Text style={[styles.orderBannerText, { color: colors.primary }]}>
            💧 <Text style={{ fontWeight: '700' }}>{t('appHierarchy')}</Text> {t('catCleanser')} → {t('catToner')} → {t('catSerum')} → {t('catMoisturizer')} → {t('catSunscreen')} → {t('catMasks')}
          </Text>
        </View>

        {/* Products List / State */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t('loadingCabinet')}
            </Text>
          </View>
        ) : products.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={styles.emptyIcon}>🧴✨</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {t('emptyCabinetTitle')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {t('emptyCabinetSubtitle')}
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => setIsModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyButtonText}>{t('addFirstProduct')}</Text>
            </TouchableOpacity>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyFilterContainer}>
            <Text style={[styles.emptyFilterText, { color: colors.textSecondary }]}>
              {t('noProductsFilter')}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedFilter('All')}
              style={styles.resetFilterButton}
            >
              <Text style={[styles.resetFilterText, { color: colors.primary }]}>
                {getCategoryLabel('All', t)}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productList}>
            {filteredProducts.map(product => {
              const meta = getCategoryMeta(product.category);
              const orderWeight = product.orderWeight ?? meta.orderWeight;

              return (
                <View
                  key={product.id}
                  style={[
                    styles.productCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  {/* Subtle Elegant Opened Date Badge in Corner */}
                  <View
                    style={[
                      styles.openedDateBadge,
                      {
                        backgroundColor: isDark ? '#2A2622' : '#F6F3EE',
                        borderColor: isDark ? '#3D3730' : '#EAE4DC',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.openedDateText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t('openedOn')} {formatOpenedDate(product.openedDate, t)}
                    </Text>
                  </View>

                  <View style={styles.cardMainRow}>
                    {/* Order Weight Circle */}
                    <View
                      style={[
                        styles.orderCircle,
                        {
                          backgroundColor:
                            orderWeight === 1
                              ? isDark ? '#23332A' : '#E8F1EB'
                              : isDark ? '#382721' : colors.primaryLight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.orderNumber,
                          {
                            color:
                              orderWeight === 1
                                ? colors.secondary
                                : colors.primary,
                          },
                        ]}
                      >
                        #{orderWeight}
                      </Text>
                      <Text style={styles.orderIcon}>{meta.icon}</Text>
                    </View>

                    {/* Product Details */}
                    <View style={styles.productDetails}>
                      <View style={styles.categoryPillRow}>
                        <View
                          style={[
                            styles.categoryTag,
                            {
                              backgroundColor: isDark
                                ? '#2D2824'
                                : '#F3EFE9',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryTagText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {getCategoryLabel(meta.key, t).toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={[
                          styles.productName,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {product.name}
                      </Text>

                      {product.brand ? (
                        <Text
                          style={[
                            styles.productBrand,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {product.brand}
                        </Text>
                      ) : null}
                    </View>

                    {/* Quick Delete Action */}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteProduct(product.id, product.name)}
                      activeOpacity={0.6}
                      accessibilityLabel={`Remove ${product.name}`}
                    >
                      <Text style={[styles.deleteIconText, { color: colors.textMuted }]}>
                        ✕
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Product Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalEyebrow, { color: colors.primary }]}>
                  {t('newAddition')}
                </Text>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {t('newProductTitle')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setIsModalVisible(false);
                }}
                style={styles.modalCloseButton}
              >
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Product Name Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                  {t('productName')} <Text style={{ color: colors.primary }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? '#262421' : '#F9F7F3',
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder={t('productNamePlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              {/* Brand Input (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                  {t('brandOptional')}
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? '#262421' : '#F9F7F3',
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder={t('brandPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={brand}
                  onChangeText={setBrand}
                  autoCapitalize="words"
                />
              </View>

              {/* Category Selector */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                  {t('category')} <Text style={{ color: colors.primary }}>*</Text>
                </Text>
                <Text style={[styles.inputHelp, { color: colors.textSecondary }]}>
                  {t('catHelpText')}
                </Text>

                <View style={styles.categoryGrid}>
                  {PRIMARY_CATEGORIES.map(cat => {
                    const isSelected = category === cat.key;
                    return (
                      <TouchableOpacity
                        key={cat.key}
                        style={[
                          styles.categoryOption,
                          {
                            backgroundColor: isSelected
                              ? isDark ? '#3D251E' : colors.primaryLight
                              : isDark ? '#262421' : '#F8F6F2',
                            borderColor: isSelected
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                        onPress={() => setCategory(cat.key)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.catOptionHeader}>
                          <Text style={styles.catOptionIcon}>{cat.icon}</Text>
                          <View
                            style={[
                              styles.stepBadge,
                              {
                                backgroundColor: isSelected
                                  ? colors.primary
                                  : isDark ? '#36322E' : '#E6E1D8',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.stepBadgeText,
                                {
                                  color: isSelected
                                    ? '#FFFFFF'
                                    : colors.textSecondary,
                                },
                              ]}
                            >
                              #{cat.orderWeight}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.catOptionLabel,
                            {
                              color: isSelected
                                ? colors.primary
                                : colors.textPrimary,
                              fontWeight: isSelected ? '700' : '600',
                            },
                          ]}
                        >
                          {getCategoryLabel(cat.key, t)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Opened Date Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelWithActionRow}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                    {t('openedDate')} <Text style={{ color: colors.primary }}>*</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => setOpenedDate(getTodayFormatted())}
                    style={styles.todayButton}
                  >
                    <Text style={[styles.todayButtonText, { color: colors.primary }]}>
                      {t('setToToday')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? '#262421' : '#F9F7F3',
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="YYYY-MM-DD (e.g. 2026-11-04)"
                  placeholderTextColor={colors.textMuted}
                  value={openedDate}
                  onChangeText={setOpenedDate}
                />
                <Text style={[styles.dateHint, { color: colors.textMuted }]}>
                  {t('paoHint')}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[
                    styles.modalCancelButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => {
                    resetForm();
                    setIsModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>
                    {t('cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalSaveButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleSaveProduct}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSaveText}>{t('saveProduct')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.md,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    shadowColor: '#C86D56',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pillsContainer: {
    gap: 8,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderBanner: {
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  orderBannerText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
    maxWidth: 280,
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyFilterContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyFilterText: {
    fontSize: 13,
  },
  resetFilterButton: {
    padding: 6,
  },
  resetFilterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  productList: {
    gap: 12,
  },
  productCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    position: 'relative',
  },
  openedDateBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    zIndex: 2,
  },
  openedDateText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  orderNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  orderIcon: {
    fontSize: 12,
    marginTop: -2,
  },
  productDetails: {
    flex: 1,
    paddingRight: 28,
  },
  categoryPillRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  categoryTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  categoryTagText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 12,
  },
  deleteButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
    maxHeight: '88%',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 6,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  labelWithActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputHelp: {
    fontSize: 11,
    marginTop: -2,
    marginBottom: 8,
  },
  todayButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  dateHint: {
    fontSize: 11,
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    width: '48.5%',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 10,
  },
  catOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  catOptionIcon: {
    fontSize: 18,
  },
  stepBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  catOptionLabel: {
    fontSize: 12,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1.5,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
