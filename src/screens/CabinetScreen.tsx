import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

interface CabinetProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  orderWeight: number;
  routine: 'AM' | 'PM' | 'Both';
}

const SAMPLE_CABINET: CabinetProduct[] = [
  { id: '1', name: 'Gentle Foaming Cleanser', brand: 'CeraVe', category: 'Cleanser', orderWeight: 1, routine: 'Both' },
  { id: '2', name: 'Hydrating Rose Mist', brand: 'Fresh', category: 'Toner', orderWeight: 2, routine: 'Both' },
  { id: '3', name: 'BHA 2% Liquid Exfoliant', brand: "Paula's Choice", category: 'Exfoliant', orderWeight: 3, routine: 'PM' },
  { id: '4', name: '10% Niacinamide + Zinc', brand: 'The Ordinary', category: 'Serum', orderWeight: 4, routine: 'Both' },
  { id: '5', name: 'Daily Barrier Cream', brand: 'La Roche-Posay', category: 'Moisturizer', orderWeight: 6, routine: 'Both' },
  { id: '6', name: '100% Organic Rosehip Oil', brand: 'The Ordinary', category: 'Facial Oil', orderWeight: 7, routine: 'PM' },
  { id: '7', name: 'Anthelios UV Fluid SPF 50+', brand: 'La Roche-Posay', category: 'Sunscreen', orderWeight: 8, routine: 'AM' },
];

const CATEGORIES = ['All', 'Cleanser', 'Toner', 'Serum', 'Moisturizer', 'Sunscreen'];

export default function CabinetScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProducts =
    selectedCategory === 'All'
      ? SAMPLE_CABINET
      : SAMPLE_CABINET.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>INVENTORY</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Product Cabinet</Text>
            <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            {SAMPLE_CABINET.length} skincare products organized by application order.
          </Text>
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsContainer}
        >
          {CATEGORIES.map(category => {
            const isSelected = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                style={[styles.pill, isSelected && styles.pillActive]}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Product List */}
        <View style={styles.productList}>
          {filteredProducts.map(product => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.orderBadge}>
                <Text style={styles.orderBadgeText}>#{product.orderWeight}</Text>
              </View>

              <View style={styles.productContent}>
                <View style={styles.metaRow}>
                  <Text style={styles.categoryText}>{product.category.toUpperCase()}</Text>
                  <View style={styles.routineBadge}>
                    <Text style={styles.routineBadgeText}>{product.routine}</Text>
                  </View>
                </View>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productBrand}>{product.brand}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    color: COLORS.secondary,
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
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  addButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  pillsContainer: {
    gap: 8,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: '#EFECE6',
  },
  pillActive: {
    backgroundColor: COLORS.textPrimary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  productList: {
    gap: 12,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  orderBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  orderBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  productContent: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: COLORS.textMuted,
  },
  routineBadge: {
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  routineBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  productBrand: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
