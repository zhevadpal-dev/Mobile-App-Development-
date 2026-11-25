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
  Image,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { TranslationKey } from '../constants/translations';
import { SPACING, RADIUS } from '../constants/theme';
import {
  Product,
  ProductCategory,
  PRIMARY_CATEGORIES,
  CATEGORY_ORDER_WEIGHTS,
  RoutineType,
  MaskType,
  MaskFrequency,
} from '../types/product';
import {
  getProducts,
  addProduct,
  deleteProduct,
  updateProduct,
} from '../services/productStorage';
import { checkCabinetMilestones } from '../services/milestoneService';
import { MilestoneDefinition } from '../types/milestone';
import { analyzeProductWithGemini } from '../services/geminiVision';

/**
 * Mask Type definition with smart auto-filled recommended defaults
 */
export const MASK_TYPES: Array<{
  key: MaskType;
  labelKey: TranslationKey;
  icon: string;
  defaultFreq: MaskFrequency;
  defaultWeekends: boolean;
  defaultRoutine: RoutineType;
}> = [
  {
    key: 'full_face',
    labelKey: 'maskTypeFullFace',
    icon: '🧖‍♀️',
    defaultFreq: 'every_2_weeks',
    defaultWeekends: true,
    defaultRoutine: 'pm',
  },
  {
    key: 'under_eye',
    labelKey: 'maskTypeUnderEye',
    icon: '👀',
    defaultFreq: 'every_3_days',
    defaultWeekends: false,
    defaultRoutine: 'pm',
  },
  {
    key: 'clay_peel',
    labelKey: 'maskTypeClayPeel',
    icon: '🧪',
    defaultFreq: 'every_2_weeks',
    defaultWeekends: false,
    defaultRoutine: 'pm',
  },
];

export const MASK_FREQUENCIES: Array<{
  key: MaskFrequency;
  labelKey: TranslationKey;
}> = [
  { key: 'every_3_days', labelKey: 'freqEvery3Days' },
  { key: 'weekly', labelKey: 'freqWeekly' },
  { key: 'every_2_weeks', labelKey: 'freqEvery2Weeks' },
  { key: 'every_3_weeks', labelKey: 'freqEvery3Weeks' },
];

/**
 * Check whether a category corresponds to a mask / intensive treatment
 */
export const isMaskCategory = (category: string): boolean => {
  const clean = category.toLowerCase();
  return (
    clean === 'masks_treatments' ||
    clean === 'mask' ||
    clean.includes('mask') ||
    clean.includes('treat')
  );
};

/**
 * Format a human-readable schedule summary for mask badges
 */
export const getMaskScheduleSummary = (
  product: Product,
  t: (k: TranslationKey) => string
): string => {
  const freqMap: Record<MaskFrequency, TranslationKey> = {
    every_3_days: 'freqEvery3Days',
    weekly: 'freqWeekly',
    every_2_weeks: 'freqEvery2Weeks',
    every_3_weeks: 'freqEvery3Weeks',
  };
  const freqLabel = product.frequency
    ? t(freqMap[product.frequency] || 'freqEvery2Weeks')
    : t('freqEvery2Weeks');
  const dayLabel = product.weekendsOnly
    ? t('maskWeekendBadge')
    : t('maskAnyDayBadge');
  return `${freqLabel} • ${dayLabel}`;
};

/**
 * Detected Product metadata from Vision AI analysis
 */
export interface DetectedProductVisionData {
  name: string;
  brand: string;
  category: ProductCategory;
  routineType?: RoutineType;
}

/**
 * Modular Vision AI analysis helper.
 * Simulates analyzing a captured image and returning recognized product properties.
 * Structured cleanly so a real Vision API (e.g. Google Cloud Vision or Gemini 1.5 Flash Vision)
 * can be plugged in directly without modifying UI screens or state management.
 */
export const analyzeProductImageWithVision = async (
  _imageUri: string
): Promise<DetectedProductVisionData> => {
  // Realistic inference / network transition latency
  await new Promise(resolve => setTimeout(resolve, 1200));

  // Vision API hook: return clean initial detected properties for confirmation
  return {
    name: '',
    brand: '',
    category: 'serum',
    routineType: 'both',
  };
};

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
export const getCategoryMeta = (category: string) => {
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

  // AI Vision Scanning Simulation State
  const [isAiScanning, setIsAiScanning] = useState<boolean>(false);
  const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);

  // Action Menu Bottom Sheet State (Android / Fallback)
  const [isActionMenuVisible, setIsActionMenuVisible] = useState<boolean>(false);

  // Manual Entry Modal State
  const [isManualModalVisible, setIsManualModalVisible] = useState<boolean>(false);
  const [manualName, setManualName] = useState<string>('');
  const [manualBrand, setManualBrand] = useState<string>('');
  const [manualCategory, setManualCategory] = useState<ProductCategory>('cleanser');
  const [manualRoutine, setManualRoutine] = useState<RoutineType>('both');
  const [manualImageUri, setManualImageUri] = useState<string | null>(null);
  const [manualMaskType, setManualMaskType] = useState<MaskType>('full_face');
  const [manualFrequency, setManualFrequency] = useState<MaskFrequency>('every_2_weeks');
  const [manualWeekendsOnly, setManualWeekendsOnly] = useState<boolean>(true);
  const [isSubmittingManual, setIsSubmittingManual] = useState<boolean>(false);

  // Edit Product Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editBrand, setEditBrand] = useState<string>('');
  const [editCategory, setEditCategory] = useState<ProductCategory>('cleanser');
  const [editRoutine, setEditRoutine] = useState<RoutineType>('both');
  const [editMaskType, setEditMaskType] = useState<MaskType>('full_face');
  const [editFrequency, setEditFrequency] = useState<MaskFrequency>('every_2_weeks');
  const [editWeekendsOnly, setEditWeekendsOnly] = useState<boolean>(true);
  const [editImageUri, setEditImageUri] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);

  // Milestones celebratory toast
  const [unlockedMilestone, setUnlockedMilestone] = useState<MilestoneDefinition | null>(null);
  const [showMilestoneToast, setShowMilestoneToast] = useState<boolean>(false);

  useEffect(() => {
    if (showMilestoneToast) {
      const timer = setTimeout(() => {
        setShowMilestoneToast(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [showMilestoneToast]);

  /**
   * Auto-fill mask defaults based on mask type selection
   */
  const handleSelectManualMaskType = (type: MaskType) => {
    setManualMaskType(type);
    const def = MASK_TYPES.find(m => m.key === type);
    if (def) {
      setManualFrequency(def.defaultFreq);
      setManualWeekendsOnly(def.defaultWeekends);
      setManualRoutine(def.defaultRoutine);
    }
  };

  const handleSelectManualCategory = (catKey: ProductCategory) => {
    setManualCategory(catKey);
    if (isMaskCategory(catKey)) {
      handleSelectManualMaskType(manualMaskType || 'full_face');
    }
  };

  const handleSelectEditMaskType = (type: MaskType) => {
    setEditMaskType(type);
    const def = MASK_TYPES.find(m => m.key === type);
    if (def) {
      setEditFrequency(def.defaultFreq);
      setEditWeekendsOnly(def.defaultWeekends);
      setEditRoutine(def.defaultRoutine);
    }
  };

  const handleSelectEditCategory = (catKey: ProductCategory) => {
    setEditCategory(catKey);
    if (isMaskCategory(catKey)) {
      handleSelectEditMaskType(editMaskType || 'full_face');
    }
  };

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

      if (sorted.length >= 5) {
        checkCabinetMilestones(sorted.length)
          .then(newly => {
            if (newly.length > 0) {
              setUnlockedMilestone(newly[0]);
              setShowMilestoneToast(true);
            }
          })
          .catch(() => {});
      }
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
   * Open Action Menu (Native ActionSheet on iOS, stylish custom bottom sheet fallback on Android)
   */
  const handleOpenAddMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            t('scanWithAi'),
            t('chooseGallery'),
            t('addManually'),
            t('cancel'),
          ],
          cancelButtonIndex: 3,
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            handleScanProduct(false);
          } else if (buttonIndex === 1) {
            handleScanProduct(true);
          } else if (buttonIndex === 2) {
            handleOpenManualModal();
          }
        }
      );
    } else {
      setIsActionMenuVisible(true);
    }
  };

  /**
   * Open Manual Add Modal
   */
  const handleOpenManualModal = () => {
    setIsActionMenuVisible(false);
    setManualName('');
    setManualBrand('');
    setManualCategory('cleanser');
    setManualRoutine('both');
    setManualMaskType('full_face');
    setManualFrequency('every_2_weeks');
    setManualWeekendsOnly(true);
    setManualImageUri(null);
    setIsManualModalVisible(true);
  };

  /**
   * Optional image picker for Manual Add
   */
  const handlePickManualImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setManualImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Manual image pick error:', e);
    }
  };

  /**
   * Save Product from Manual Add Modal
   */
  const handleSaveManualProduct = async () => {
    if (!manualName.trim()) {
      Alert.alert(t('requiredField'), t('enterProductName'));
      return;
    }

    try {
      setIsSubmittingManual(true);
      const meta = getCategoryMeta(manualCategory);
      const isMask = isMaskCategory(manualCategory);

      await addProduct({
        name: manualName.trim(),
        brand: manualBrand.trim() || undefined,
        category: meta.key,
        routineType: manualRoutine,
        routineTime: manualRoutine,
        maskType: isMask ? manualMaskType : undefined,
        frequency: isMask ? manualFrequency : undefined,
        weekendsOnly: isMask ? manualWeekendsOnly : undefined,
        openedDate: getTodayFormatted(),
        orderWeight: meta.orderWeight,
        imageUri: manualImageUri || undefined,
      });

      setIsManualModalVisible(false);
      setManualName('');
      setManualBrand('');
      setManualRoutine('both');
      setManualMaskType('full_face');
      setManualFrequency('every_2_weeks');
      setManualWeekendsOnly(true);
      setManualImageUri(null);
      await loadProducts();
    } catch (error) {
      console.error('Error saving manual product:', error);
      Alert.alert(t('saveFailed'), t('couldNotSaveProduct'));
    } finally {
      setIsSubmittingManual(false);
    }
  };

  /**
   * AI Vision Analysis transition:
   * Displays smooth scanner overlay, calls real Gemini Vision API,
   * then opens the product confirmation & entry modal with the captured photo and detected metadata.
   */
  const runAiAnalysis = async (imageUri: string, base64?: string | null) => {
    setScannedImageUri(imageUri);
    setIsAiScanning(true);

    try {
      if (!base64) {
        throw new Error('Base64 image payload is missing.');
      }

      const detected = await analyzeProductWithGemini(base64);

      // Populate entry/confirmation modal with captured photo and detected metadata
      setManualImageUri(imageUri);
      setManualName(detected.name || '');
      setManualBrand(detected.brand || '');
      setManualCategory(detected.category || 'serum');
      setManualRoutine(detected.routineType || 'both');

      // If category is a mask, apply smart auto-filled mask defaults
      if (isMaskCategory(detected.category)) {
        const maskType = detected.maskType || 'full_face';
        setManualMaskType(maskType);
        const meta = MASK_TYPES.find(m => m.key === maskType);
        if (meta) {
          setManualFrequency(meta.defaultFreq);
          setManualWeekendsOnly(meta.defaultWeekends);
          if (!detected.routineType || detected.routineType === 'both') {
            setManualRoutine(meta.defaultRoutine);
          }
        }
      }

      // Dismiss scanning overlay and present confirmation modal
      setIsAiScanning(false);
      setScannedImageUri(null);
      setIsManualModalVisible(true);
    } catch (error) {
      console.warn('AI Vision analysis failed, falling back to manual entry:', error);
      setIsAiScanning(false);
      setScannedImageUri(null);

      // Gracefully show subtle alert and still open modal so app never crashes
      Alert.alert(
        t('scanAnalysisFailedTitle'),
        t('scanAnalysisFailedMessage')
      );

      // Graceful fallback: open entry modal with photo so user does not lose captured image
      setManualImageUri(imageUri);
      setManualName('');
      setManualBrand('');
      setManualCategory('serum');
      setManualRoutine('both');
      setManualMaskType('full_face');
      setManualFrequency('every_2_weeks');
      setManualWeekendsOnly(true);
      setIsManualModalVisible(true);
    }
  };

  /**
   * Launch Camera or Gallery for AI Product Scan with base64 and quality: 0.6
   */
  const handleScanProduct = async (fromGallery: boolean = false) => {
    try {
      if (fromGallery) {
        const libStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libStatus.status === 'granted') {
          const libResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
            base64: true,
          });
          if (!libResult.canceled && libResult.assets?.[0]?.uri) {
            runAiAnalysis(libResult.assets[0].uri, libResult.assets[0].base64);
          }
        } else {
          Alert.alert(t('photoPermissionNeeded'), t('photoPermissionMessage'));
        }
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        const libStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libStatus.status === 'granted') {
          const libResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
            base64: true,
          });
          if (!libResult.canceled && libResult.assets?.[0]?.uri) {
            runAiAnalysis(libResult.assets[0].uri, libResult.assets[0].base64);
          }
        } else {
          Alert.alert(t('cameraPermissionNeeded'), t('cameraPermissionMessage'));
        }
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        runAiAnalysis(result.assets[0].uri, result.assets[0].base64);
      }
    } catch (error) {
      console.warn('Camera error, trying gallery fallback:', error);
      try {
        const libResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.6,
          base64: true,
        });
        if (!libResult.canceled && libResult.assets?.[0]?.uri) {
          runAiAnalysis(libResult.assets[0].uri, libResult.assets[0].base64);
        }
      } catch (e) {
        console.error('Gallery fallback error:', e);
      }
    }
  };

  /**
   * Open Edit Product Modal
   */
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditBrand(product.brand || '');
    setEditCategory(getCategoryMeta(product.category).key);
    setEditRoutine(product.routineType || product.routineTime || 'both');
    setEditImageUri(product.imageUri || null);
    setEditMaskType(product.maskType || 'full_face');
    setEditFrequency(product.frequency || 'every_2_weeks');
    setEditWeekendsOnly(product.weekendsOnly !== undefined ? product.weekendsOnly : true);
    setIsEditModalVisible(true);
  };

  /**
   * Optional image picker to replace photo in Edit Modal
   */
  const handlePickEditImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setEditImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Edit image pick error:', e);
    }
  };

  /**
   * Save Product Edits
   */
  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    if (!editName.trim()) {
      Alert.alert(t('requiredField'), t('enterProductName'));
      return;
    }

    try {
      setIsSubmittingEdit(true);
      const meta = getCategoryMeta(editCategory);
      const isMask = isMaskCategory(editCategory);

      await updateProduct(editingProduct.id, {
        name: editName.trim(),
        brand: editBrand.trim() || undefined,
        category: meta.key,
        routineType: editRoutine,
        routineTime: editRoutine,
        maskType: isMask ? editMaskType : undefined,
        frequency: isMask ? editFrequency : undefined,
        weekendsOnly: isMask ? editWeekendsOnly : undefined,
        orderWeight: meta.orderWeight,
        imageUri: editImageUri || undefined,
      });

      setIsEditModalVisible(false);
      setEditingProduct(null);
      await loadProducts();
    } catch (error) {
      console.error('Failed to update product:', error);
      Alert.alert(t('saveFailed'), 'Failed to update product.');
    } finally {
      setIsSubmittingEdit(false);
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
              setIsEditModalVisible(false);
              setEditingProduct(null);
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
              style={[styles.circularAddButton, { backgroundColor: colors.primary }]}
              onPress={handleOpenAddMenu}
              activeOpacity={0.8}
              accessibilityLabel="Add skincare product"
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
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
              onPress={handleOpenAddMenu}
              activeOpacity={0.85}
              accessibilityLabel="Add first skincare product"
            >
              <View style={styles.emptyButtonContent}>
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>{t('addFirstProduct')}</Text>
              </View>
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
                  {/* Left: Order Weight Circle / Captured Product Thumbnail */}
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
                      {product.imageUri ? (
                        <Image
                          source={{ uri: product.imageUri }}
                          style={styles.productThumbnail}
                        />
                      ) : (
                        <Text style={styles.orderIcon}>{meta.icon}</Text>
                      )}
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

                        {product.routineType && product.routineType !== 'none' ? (
                          <View
                            style={[
                              styles.categoryTag,
                              {
                                backgroundColor: isDark ? '#263328' : '#EEF5F0',
                                borderColor: isDark ? '#324735' : '#D9E8DC',
                                borderWidth: 1,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.categoryTagText,
                                { color: colors.secondary },
                              ]}
                            >
                              {product.routineType === 'am'
                                ? t('routineAmShort')
                                : product.routineType === 'pm'
                                ? t('routinePmShort')
                                : t('routineBothShort')}
                            </Text>
                          </View>
                        ) : null}

                        {isMaskCategory(product.category) && product.frequency ? (
                          <View
                            style={[
                              styles.categoryTag,
                              {
                                backgroundColor: isDark ? '#2B2533' : '#F4F0F7',
                                borderColor: isDark ? '#3D344B' : '#E3DAEB',
                                borderWidth: 1,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.categoryTagText,
                                { color: isDark ? '#B39DDB' : '#7E57C2' },
                              ]}
                            >
                              📅 {getMaskScheduleSummary(product, t)}
                            </Text>
                          </View>
                        ) : null}
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

                      {/* Subtle Opened Date */}
                      <Text
                        style={[
                          styles.openedDateText,
                          { color: colors.textMuted },
                        ]}
                      >
                        {t('openedOn')} {formatOpenedDate(product.openedDate, t)}
                      </Text>
                    </View>

                    {/* Right: Single Edit (pencil) icon vertically centered */}
                    <TouchableOpacity
                      style={styles.actionIconButton}
                      onPress={() => handleOpenEditModal(product)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityLabel={`Edit ${product.name}`}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={16}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ======================================================== */}
      {/* AI Vision Analysis Simulation Overlay                     */}
      {/* ======================================================== */}
      <Modal
        visible={isAiScanning}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.aiOverlay}>
          <View
            style={[
              styles.aiModalCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* Viewfinder Frame */}
            <View
              style={[
                styles.scannerFrame,
                { backgroundColor: isDark ? '#1C1A18' : '#F6F3EE' },
              ]}
            >
              {scannedImageUri ? (
                <Image
                  source={{ uri: scannedImageUri }}
                  style={styles.scannerImage}
                />
              ) : (
                <View style={styles.scannerPlaceholder}>
                  <Text style={styles.scannerPlaceholderEmoji}>🧴</Text>
                </View>
              )}

              {/* Viewfinder Corner Accents */}
              <View style={[styles.cornerTL, { borderColor: colors.primary }]} />
              <View style={[styles.cornerTR, { borderColor: colors.primary }]} />
              <View style={[styles.cornerBL, { borderColor: colors.primary }]} />
              <View style={[styles.cornerBR, { borderColor: colors.primary }]} />

              {/* Laser Scanning Beam */}
              <View
                style={[
                  styles.scannerLaserBeam,
                  { backgroundColor: colors.primary },
                ]}
              />
            </View>

            {/* AI Status Text */}
            <View style={styles.aiInfoSection}>
              <View style={styles.aiSpinnerRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.aiTitle, { color: colors.textPrimary }]}>
                  {t('aiAnalyzing')}
                </Text>
              </View>

              <Text style={[styles.aiSubtitle, { color: colors.textSecondary }]}>
                {t('aiAnalyzingSub')}
              </Text>

              <View
                style={[
                  styles.aiPillBadge,
                  {
                    backgroundColor: isDark ? '#23332A' : '#E8F1EB',
                    borderColor: isDark ? '#2D4437' : '#D0E3D6',
                  },
                ]}
              >
                <Text style={[styles.aiPillBadgeText, { color: colors.secondary }]}>
                  ✨ AI Auto-Categorization
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* Action Menu (Custom Bottom Sheet for Android / Fallback) */}
      {/* ======================================================== */}
      <Modal
        visible={isActionMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsActionMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.actionSheetOverlay}
          activeOpacity={1}
          onPress={() => setIsActionMenuVisible(false)}
        >
          <View
            style={[
              styles.actionSheetCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={[
                styles.sheetActionOption,
                { borderBottomColor: colors.border },
              ]}
              onPress={() => {
                setIsActionMenuVisible(false);
                handleScanProduct(false);
              }}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.sheetActionIconCircle,
                  { backgroundColor: isDark ? '#23332A' : '#E8F1EB' },
                ]}
              >
                <Ionicons name="camera" size={18} color={colors.secondary} />
              </View>
              <View style={styles.sheetActionTextCol}>
                <Text style={[styles.sheetActionTitle, { color: colors.textPrimary }]}>
                  {t('scanWithAi')}
                </Text>
                <Text style={[styles.sheetActionSub, { color: colors.textSecondary }]}>
                  {t('aiAnalyzingSub')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sheetActionOption,
                { borderBottomColor: colors.border },
              ]}
              onPress={() => {
                setIsActionMenuVisible(false);
                handleScanProduct(true);
              }}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.sheetActionIconCircle,
                  { backgroundColor: isDark ? '#2E2822' : '#F5EFE8' },
                ]}
              >
                <Ionicons name="images" size={18} color={colors.primary} />
              </View>
              <View style={styles.sheetActionTextCol}>
                <Text style={[styles.sheetActionTitle, { color: colors.textPrimary }]}>
                  {t('chooseGallery')}
                </Text>
                <Text style={[styles.sheetActionSub, { color: colors.textSecondary }]}>
                  {t('aiAnalyzingSub')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetActionOption}
              onPress={handleOpenManualModal}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.sheetActionIconCircle,
                  { backgroundColor: isDark ? '#3D2721' : colors.primaryLight },
                ]}
              >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.sheetActionTextCol}>
                <Text style={[styles.sheetActionTitle, { color: colors.textPrimary }]}>
                  {t('addManually')}
                </Text>
                <Text style={[styles.sheetActionSub, { color: colors.textSecondary }]}>
                  {t('productNamePlaceholder')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sheetCancelBtn,
                {
                  backgroundColor: isDark ? '#262421' : '#F6F3EE',
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setIsActionMenuVisible(false)}
              activeOpacity={0.75}
            >
              <Text style={[styles.sheetCancelText, { color: colors.textSecondary }]}>
                {t('cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ======================================================== */}
      {/* Manual Product Addition Modal                            */}
      {/* ======================================================== */}
      <Modal
        visible={isManualModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsManualModalVisible(false)}
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
                  {manualImageUri ? t('confirmProductDetails') : t('addManually')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsManualModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Optional Photo Section with Elegant Placeholder */}
              <View style={styles.imageSelectorGroup}>
                <View
                  style={[
                    styles.imagePreviewCircle,
                    {
                      backgroundColor: isDark ? '#262421' : '#F6F3EE',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {manualImageUri ? (
                    <Image source={{ uri: manualImageUri }} style={styles.imagePreviewPhoto} />
                  ) : (
                    <Text style={styles.imagePreviewPlaceholderEmoji}>
                      {getCategoryMeta(manualCategory).icon}
                    </Text>
                  )}
                </View>

                <View style={styles.imageButtonsCol}>
                  <TouchableOpacity
                    style={[
                      styles.changePhotoButton,
                      { backgroundColor: isDark ? '#332E2A' : '#EFEAE3' },
                    ]}
                    onPress={handlePickManualImage}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="camera-outline" size={14} color={colors.textPrimary} />
                    <Text style={[styles.changePhotoText, { color: colors.textPrimary }]}>
                      {manualImageUri ? t('changePhoto') : t('addPhotoOptional')}
                    </Text>
                  </TouchableOpacity>

                  {manualImageUri ? (
                    <TouchableOpacity
                      onPress={() => setManualImageUri(null)}
                      style={styles.removePhotoButton}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.removePhotoText, { color: colors.primary }]}>
                        {t('removePhotoOption')}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

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
                  value={manualName}
                  onChangeText={setManualName}
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
                  value={manualBrand}
                  onChangeText={setManualBrand}
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
                    const isSelected = manualCategory === cat.key;
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
                        onPress={() => handleSelectManualCategory(cat.key)}
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

              {/* Conditional Mask Scheduling Section */}
              {isMaskCategory(manualCategory) ? (
                <View
                  style={[
                    styles.maskScheduleSection,
                    {
                      backgroundColor: isDark ? '#232028' : '#F7F5FA',
                      borderColor: isDark ? '#35303D' : '#E6E0ED',
                    },
                  ]}
                >
                  <View style={styles.maskScheduleHeader}>
                    <Text style={[styles.maskScheduleTitle, { color: colors.secondary }]}>
                      ✨ {t('maskSchedule')}
                    </Text>
                    <Text style={[styles.maskScheduleSub, { color: colors.textSecondary }]}>
                      {t('maskScheduleSub')}
                    </Text>
                  </View>

                  {/* Mask Type Selector */}
                  <View style={styles.maskScheduleGroup}>
                    <Text style={[styles.maskSubLabel, { color: colors.textPrimary }]}>
                      {t('maskType')}
                    </Text>
                    <View style={styles.maskTypeRow}>
                      {MASK_TYPES.map(m => {
                        const isSelected = manualMaskType === m.key;
                        return (
                          <TouchableOpacity
                            key={m.key}
                            style={[
                              styles.maskTypeBtn,
                              isSelected && [
                                styles.maskTypeBtnActive,
                                { backgroundColor: colors.secondary, borderColor: colors.secondary },
                              ],
                              !isSelected && {
                                backgroundColor: isDark ? '#2B2632' : '#FFFFFF',
                                borderColor: isDark ? '#3D3647' : '#E2DCE8',
                              },
                            ]}
                            onPress={() => handleSelectManualMaskType(m.key)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.maskTypeIcon}>{m.icon}</Text>
                            <Text
                              style={[
                                styles.maskTypeText,
                                {
                                  color: isSelected ? '#FFFFFF' : colors.textPrimary,
                                  fontWeight: isSelected ? '700' : '500',
                                },
                              ]}
                            >
                              {t(m.labelKey)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Frequency Override */}
                  <View style={styles.maskScheduleGroup}>
                    <Text style={[styles.maskSubLabel, { color: colors.textPrimary }]}>
                      {t('maskFrequency')}
                    </Text>
                    <View style={styles.maskChipGrid}>
                      {MASK_FREQUENCIES.map(f => {
                        const isSelected = manualFrequency === f.key;
                        return (
                          <TouchableOpacity
                            key={f.key}
                            style={[
                              styles.maskChipBtn,
                              isSelected && {
                                backgroundColor: isDark ? '#382B48' : '#EDE7F6',
                                borderColor: isDark ? '#7E57C2' : '#7E57C2',
                              },
                              !isSelected && {
                                backgroundColor: isDark ? '#2B2632' : '#FFFFFF',
                                borderColor: isDark ? '#3D3647' : '#E2DCE8',
                              },
                            ]}
                            onPress={() => setManualFrequency(f.key)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.maskChipText,
                                {
                                  color: isSelected
                                    ? isDark ? '#D1C4E9' : '#5E35B1'
                                    : colors.textSecondary,
                                  fontWeight: isSelected ? '700' : '500',
                                },
                              ]}
                            >
                              {t(f.labelKey)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Day Preference Override */}
                  <View style={styles.maskScheduleGroup}>
                    <Text style={[styles.maskSubLabel, { color: colors.textPrimary }]}>
                      {t('maskDayPreference')}
                    </Text>
                    <View style={styles.maskPreferenceRow}>
                      <TouchableOpacity
                        style={[
                          styles.maskPrefBtn,
                          !manualWeekendsOnly && {
                            backgroundColor: isDark ? '#382B48' : '#EDE7F6',
                            borderColor: isDark ? '#7E57C2' : '#7E57C2',
                          },
                          manualWeekendsOnly && {
                            backgroundColor: isDark ? '#2B2632' : '#FFFFFF',
                            borderColor: isDark ? '#3D3647' : '#E2DCE8',
                          },
                        ]}
                        onPress={() => setManualWeekendsOnly(false)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.maskPrefText,
                            {
                              color: !manualWeekendsOnly
                                ? isDark ? '#D1C4E9' : '#5E35B1'
                                : colors.textSecondary,
                              fontWeight: !manualWeekendsOnly ? '700' : '500',
                            },
                          ]}
                        >
                          {t('dayAny')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.maskPrefBtn,
                          manualWeekendsOnly && {
                            backgroundColor: isDark ? '#382B48' : '#EDE7F6',
                            borderColor: isDark ? '#7E57C2' : '#7E57C2',
                          },
                          !manualWeekendsOnly && {
                            backgroundColor: isDark ? '#2B2632' : '#FFFFFF',
                            borderColor: isDark ? '#3D3647' : '#E2DCE8',
                          },
                        ]}
                        onPress={() => setManualWeekendsOnly(true)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.maskPrefText,
                            {
                              color: manualWeekendsOnly
                                ? isDark ? '#D1C4E9' : '#5E35B1'
                                : colors.textSecondary,
                              fontWeight: manualWeekendsOnly ? '700' : '500',
                            },
                          ]}
                        >
                          {t('dayWeekendsOnly')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* Routine Assignment Selector */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                  {t('routineAssignment')}
                </Text>
                <View style={styles.routineSelectorRow}>
                  {(['am', 'pm', 'both'] as RoutineType[]).map(r => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.routineOptionBtn,
                        manualRoutine === r && [
                          styles.routineOptionBtnActive,
                          { backgroundColor: colors.primary, borderColor: colors.primary },
                        ],
                        manualRoutine !== r && {
                          backgroundColor: isDark ? '#262421' : '#F6F3EE',
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setManualRoutine(r)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.routineOptionText,
                          {
                            color: manualRoutine === r ? '#FFFFFF' : colors.textPrimary,
                            fontWeight: manualRoutine === r ? '700' : '500',
                          },
                        ]}
                      >
                        {r === 'am' ? t('routineAm') : r === 'pm' ? t('routinePm') : t('routineBoth')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[
                    styles.modalCancelButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setIsManualModalVisible(false)}
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
                  onPress={handleSaveManualProduct}
                  disabled={isSubmittingManual}
                  activeOpacity={0.85}
                >
                  {isSubmittingManual ? (
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

      {/* ======================================================== */}
      {/* Subtle Edit Product Modal                                 */}
      {/* ======================================================== */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
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
                  {t('editProduct')}
                </Text>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {editingProduct?.name || t('editProduct')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Product Photo Replacement Section */}
              <View style={styles.imageSelectorGroup}>
                <View
                  style={[
                    styles.imagePreviewCircle,
                    {
                      backgroundColor: isDark ? '#262421' : '#F6F3EE',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {editImageUri ? (
                    <Image source={{ uri: editImageUri }} style={styles.imagePreviewPhoto} />
                  ) : (
                    <Text style={styles.imagePreviewPlaceholderEmoji}>
                      {getCategoryMeta(editCategory).icon}
                    </Text>
                  )}
                </View>

                <View style={styles.imageButtonsCol}>
                  <TouchableOpacity
                    style={[
                      styles.changePhotoButton,
                      { backgroundColor: isDark ? '#332E2A' : '#EFEAE3' },
                    ]}
                    onPress={handlePickEditImage}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="camera-outline" size={14} color={colors.textPrimary} />
                    <Text style={[styles.changePhotoText, { color: colors.textPrimary }]}>
                      {editImageUri ? t('changePhoto') : t('addPhotoOptional')}
                    </Text>
                  </TouchableOpacity>

                  {editImageUri ? (
                    <TouchableOpacity
                      onPress={() => setEditImageUri(null)}
                      style={styles.removePhotoButton}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.removePhotoText, { color: colors.primary }]}>
                        {t('removePhotoOption')}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

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
                  value={editName}
                  onChangeText={setEditName}
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
                  value={editBrand}
                  onChangeText={setEditBrand}
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
                    const isSelected = editCategory === cat.key;
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
                        onPress={() => handleSelectEditCategory(cat.key)}
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

              {/* Conditional Mask Scheduling Section */}
              {isMaskCategory(editCategory) ? (
                <View
                  style={[
                    styles.maskScheduleSection,
                    {
                      backgroundColor: isDark ? '#232028' : '#F7F5FA',
                      borderColor: isDark ? '#35303D' : '#E6E0ED',
                    },
                  ]}
                >
                  <View style={styles.maskScheduleHeader}>
                    <Text style={[styles.maskScheduleTitle, { color: colors.secondary }]}>
                      ✨ {t('maskSchedule')}
                    </Text>
                    <Text style={[styles.maskScheduleSub, { color: colors.textSecondary }]}>
                      {t('maskScheduleSub')}
                    </Text>
                  </View>

                  {/* Mask Type Selector */}
                  <View style={styles.maskScheduleGroup}>
                    <Text style={[styles.maskSubLabel, { color: colors.textPrimary }]}>
                      {t('maskType')}
                    </Text>
                    <View style={styles.maskTypeRow}>
                      {MASK_TYPES.map(m => {
                        const isSelected = editMaskType === m.key;
                        return (
                          <TouchableOpacity
                            key={m.key}
                            style={[
                              styles.maskTypeBtn,
                              isSelected && [
                                styles.maskTypeBtnActive,
                                { backgroundColor: colors.secondary, borderColor: colors.secondary },
                              ],
                              !isSelected && {
                                backgroundColor: isDark ? '#2B2632' : '#FFFFFF',
                                borderColor: isDark ? '#3D3647' : '#E2DCE8',
                              },
                            ]}
                            onPress={() => handleSelectEditMaskType(m.key)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.maskTypeIcon}>{m.icon}</Text>
                            <Text
                              style={[
                                styles.maskTypeText,
                                {
                                  color: isSelected ? '#FFFFFF' : colors.textPrimary,
                                  fontWeight: isSelected ? '700' : '500',
                                },
                              ]}
                            >
                              {t(m.labelKey)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Frequency Override */}
                  <View style={styles.maskScheduleGroup}>
                    <Text style={[styles.maskSubLabel, { color: colors.textPrimary }]}>
                      {t('maskFrequency')}
                    </Text>
                    <View style={styles.maskChipGrid}>
                      {MASK_FREQUENCIES.map(f => {
                        const isSelected = editFrequency === f.key;
                        return (
                          <TouchableOpacity
                            key={f.key}
                            style={[
                              styles.maskChipBtn,
                              isSelected && {
                                backgroundColor: isDark ? '#382B48' : '#EDE7F6',
                                borderColor: isDark ? '#7E57C2' : '#7E57C2',
                              },
                              !isSelected && {
                                backgroundColor: isDark ? '#2B2632' : '#FFFFFF',
                                borderColor: isDark ? '#3D3647' : '#E2DCE8',
                              },
                            ]}
                            onPress={() => setEditFrequency(f.key)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.maskChipText,
                                {
                                  color: isSelected
                                    ? isDark ? '#D1C4E9' : '#5E35B1'
                                    : colors.textSecondary,
                                  fontWeight: isSelected ? '700' : '500',
                                },
                              ]}
                            >
                              {t(f.labelKey)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Day Preference Override */}
                  <View style={styles.maskScheduleGroup}>
                    <Text style={[styles.maskSubLabel, { color: colors.textPrimary }]}>
                      {t('maskDayPreference')}
                    </Text>
                    <View style={styles.maskPreferenceRow}>
                      <TouchableOpacity
                        style={[
                          styles.maskPrefBtn,
                          !editWeekendsOnly && {
                            backgroundColor: isDark ? '#382B48' : '#EDE7F6',
                            borderColor: isDark ? '#7E57C2' : '#7E57C2',
                          },
                          editWeekendsOnly && {
                            backgroundColor: isDark ? '#2B2632' : '#FFFFFF',
                            borderColor: isDark ? '#3D3647' : '#E2DCE8',
                          },
                        ]}
                        onPress={() => setEditWeekendsOnly(false)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.maskPrefText,
                            {
                              color: !editWeekendsOnly
                                ? isDark ? '#D1C4E9' : '#5E35B1'
                                : colors.textSecondary,
                              fontWeight: !editWeekendsOnly ? '700' : '500',
                            },
                          ]}
                        >
                          {t('dayAny')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.maskPrefBtn,
                          editWeekendsOnly && {
                            backgroundColor: isDark ? '#382B48' : '#EDE7F6',
                            borderColor: isDark ? '#7E57C2' : '#7E57C2',
                          },
                          !editWeekendsOnly && {
                            backgroundColor: isDark ? '#2B2632' : '#FFFFFF',
                            borderColor: isDark ? '#3D3647' : '#E2DCE8',
                          },
                        ]}
                        onPress={() => setEditWeekendsOnly(true)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.maskPrefText,
                            {
                              color: editWeekendsOnly
                                ? isDark ? '#D1C4E9' : '#5E35B1'
                                : colors.textSecondary,
                              fontWeight: editWeekendsOnly ? '700' : '500',
                            },
                          ]}
                        >
                          {t('dayWeekendsOnly')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* Routine Assignment Selector */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                  {t('routineAssignment')}
                </Text>
                <View style={styles.routineSelectorRow}>
                  {(['am', 'pm', 'both'] as RoutineType[]).map(r => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.routineOptionBtn,
                        editRoutine === r && [
                          styles.routineOptionBtnActive,
                          { backgroundColor: colors.primary, borderColor: colors.primary },
                        ],
                        editRoutine !== r && {
                          backgroundColor: isDark ? '#262421' : '#F6F3EE',
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setEditRoutine(r)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.routineOptionText,
                          {
                            color: editRoutine === r ? '#FFFFFF' : colors.textPrimary,
                            fontWeight: editRoutine === r ? '700' : '500',
                          },
                        ]}
                      >
                        {r === 'am' ? t('routineAm') : r === 'pm' ? t('routinePm') : t('routineBoth')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[
                    styles.modalCancelButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setIsEditModalVisible(false)}
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
                  onPress={handleSaveEdit}
                  disabled={isSubmittingEdit}
                  activeOpacity={0.85}
                >
                  {isSubmittingEdit ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSaveText}>{t('saveChanges')}</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Clean Muted Destructive Delete Product Button */}
              {editingProduct ? (
                <TouchableOpacity
                  style={[
                    styles.modalDeleteButton,
                    {
                      backgroundColor: isDark ? '#2D1B1B' : '#FDF3F2',
                      borderColor: isDark ? '#4D2929' : '#F7D6D4',
                    },
                  ]}
                  onPress={() => handleDeleteProduct(editingProduct.id, editingProduct.name)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="trash-outline"
                    size={15}
                    color={isDark ? '#E57373' : '#C53030'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.modalDeleteText,
                      { color: isDark ? '#E57373' : '#C53030' },
                    ]}
                  >
                    {t('deleteProduct')}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Floating Celebratory Milestone Toast Banner */}
      {showMilestoneToast && unlockedMilestone && (
        <View style={styles.toastContainer} pointerEvents="box-none">
          <TouchableOpacity
            style={[
              styles.toastCard,
              {
                backgroundColor: isDark ? '#26201B' : '#FFFDF9',
                borderColor: isDark ? 'rgba(217, 130, 107, 0.45)' : 'rgba(217, 130, 107, 0.35)',
              },
            ]}
            onPress={() => setShowMilestoneToast(false)}
            activeOpacity={0.9}
          >
            <View style={styles.toastIconCircle}>
              <Text style={styles.toastIconEmoji}>{unlockedMilestone.icon}</Text>
            </View>
            <View style={styles.toastTextCol}>
              <Text style={[styles.toastTitle, { color: colors.primary }]}>
                {t('milestoneUnlockedToast')}
              </Text>
              <Text style={[styles.toastSubtitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {t(unlockedMilestone.titleKey as any)}: {t(unlockedMilestone.descKey as any)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowMilestoneToast(false)}
              style={styles.toastCloseBtn}
            >
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}
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
  circularAddButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C86D56',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
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
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  openedDateText: {
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.1,
  },
  orderCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  orderIcon: {
    fontSize: 20,
    textAlign: 'center',
  },
  productDetails: {
    flex: 1,
    paddingRight: 8,
  },
  categoryPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
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
  productThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  actionIconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  modalDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  modalDeleteText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  /* AI Vision Scanner Overlay */
  aiOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  aiModalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  scannerFrame: {
    width: 180,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  scannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scannerPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerPlaceholderEmoji: {
    fontSize: 50,
  },
  cornerTL: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 18,
    height: 18,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 18,
    height: 18,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 18,
    height: 18,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  scannerLaserBeam: {
    position: 'absolute',
    top: '49%',
    left: 8,
    right: 8,
    height: 2,
    opacity: 0.85,
    borderRadius: 1,
  },
  aiInfoSection: {
    alignItems: 'center',
    gap: 6,
  },
  aiSpinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  aiSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
  aiPillBadge: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  aiPillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
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
  routineSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  routineOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineOptionBtnActive: {},
  routineOptionText: {
    fontSize: 12,
  },
  /* Image Selector / Replacement in Modals */
  imageSelectorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: SPACING.md,
    paddingVertical: 4,
  },
  imagePreviewCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  imagePreviewPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePreviewPlaceholderEmoji: {
    fontSize: 24,
  },
  imageButtonsCol: {
    flex: 1,
    gap: 6,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  removePhotoButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
  },
  removePhotoText: {
    fontSize: 11,
    fontWeight: '600',
  },
  /* Action Sheet Modal (Fallback / Android) */
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  actionSheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : SPACING.lg,
    borderWidth: 1,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  sheetActionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  sheetActionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetActionTextCol: {
    flex: 1,
  },
  sheetActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  sheetActionSub: {
    fontSize: 12,
  },
  sheetCancelBtn: {
    marginTop: SPACING.md,
    height: 46,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  /* Mask Scheduling Styles */
  maskScheduleSection: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
    gap: 12,
  },
  maskScheduleHeader: {
    marginBottom: 2,
  },
  maskScheduleTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  maskScheduleSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  maskScheduleGroup: {
    gap: 6,
  },
  maskSubLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  maskTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  maskTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  maskTypeBtnActive: {
    elevation: 2,
  },
  maskTypeIcon: {
    fontSize: 18,
  },
  maskTypeText: {
    fontSize: 10,
    textAlign: 'center',
  },
  maskChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  maskChipBtn: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  maskChipText: {
    fontSize: 11,
  },
  maskPreferenceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  maskPrefBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskPrefText: {
    fontSize: 11,
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 20,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    gap: 10,
  },
  toastIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(217, 130, 107, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastIconEmoji: {
    fontSize: 20,
  },
  toastTextCol: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  toastSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  toastCloseBtn: {
    padding: 4,
  },
});
