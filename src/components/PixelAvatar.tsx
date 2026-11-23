import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { createAvatar } from '@dicebear/core';
import * as pixelArt from '@dicebear/pixel-art';
import { PixelAvatarConfig } from '../types/auth';

export interface SkinToneOption {
  id: string;
  label: string;
  color: string;
}

export interface HairStyleOption {
  id: string;
  label: string;
  icon: string;
  type?: 'updo' | 'long' | 'short';
}

export interface HairColorOption {
  id: string;
  label: string;
  color: string;
}

export interface GlassesOption {
  id: string;
  label: string;
  icon: string;
}

export interface AccessoryOption {
  id: string;
  label: string;
  icon: string;
}

export interface ClothingOption {
  id: string;
  label: string;
  icon: string;
}

export interface ClothingColorOption {
  id: string;
  label: string;
  color: string;
}

export interface BgColorOption {
  id: string;
  label: string;
  color: string;
}

export const SKIN_TONES: SkinToneOption[] = [
  { id: 'ffd8b4', label: 'Porcelain', color: '#FFD8B4' },
  { id: 'f5c7a5', label: 'Warm Peach', color: '#F5C7A5' },
  { id: 'dfa878', label: 'Golden Honey', color: '#DFA878' },
  { id: 'd09b68', label: 'Warm Sand', color: '#D09B68' },
  { id: 'a86e45', label: 'Rich Tan', color: '#A86E45' },
  { id: '65432b', label: 'Deep Espresso', color: '#65432B' },
];

export const HAIR_STYLES: HairStyleOption[] = [
  { id: 'long16', label: 'Messy Bun', icon: '🍡', type: 'updo' },
  { id: 'long01', label: 'Long Waves', icon: '✨', type: 'long' },
  { id: 'long08', label: 'High Pony', icon: '🎀', type: 'updo' },
  { id: 'long02', label: 'Straight Long', icon: '💫', type: 'long' },
  { id: 'long19', label: 'Boho Braids', icon: '🌾', type: 'long' },
  { id: 'short05', label: 'Chic Bob', icon: '🌿', type: 'short' },
  { id: 'short01', label: 'Soft Pixie', icon: '✂️', type: 'short' },
  { id: 'short03', label: 'Wavy Crop', icon: '🌊', type: 'short' },
  { id: 'short16', label: 'Sleek Short', icon: '🌱', type: 'short' },
  { id: 'short02', label: 'Clean Cut', icon: '⭐', type: 'short' },
];

export const HAIR_COLORS: HairColorOption[] = [
  { id: '28150a', label: 'Espresso', color: '#28150A' },
  { id: '1a1a1a', label: 'Soft Black', color: '#1A1A1A' },
  { id: '603a14', label: 'Warm Cocoa', color: '#603A14' },
  { id: 'a78961', label: 'Caramel', color: '#A78961' },
  { id: 'cab188', label: 'Honey Blonde', color: '#CAB188' },
  { id: '612616', label: 'Auburn', color: '#612616' },
  { id: 'e89eb8', label: 'Pastel Rose', color: '#E89EB8' },
  { id: 'b0b3b8', label: 'Silver', color: '#B0B3B8' },
];

export const GLASSES_OPTIONS: GlassesOption[] = [
  { id: 'none', label: 'None', icon: '✕' },
  { id: 'light01', label: 'Round Gold', icon: '👓' },
  { id: 'light02', label: 'Thin Frames', icon: '👓' },
  { id: 'light05', label: 'Cat Eye', icon: '🕶️' },
  { id: 'dark01', label: 'Square Black', icon: '🕶️' },
  { id: 'dark03', label: 'Sun Shades', icon: '🕶' },
  { id: 'dark05', label: 'Aviators', icon: '🕶️' },
];

export const ACCESSORIES_OPTIONS: AccessoryOption[] = [
  { id: 'none', label: 'None', icon: '✕' },
  { id: 'variant01', label: 'Earrings', icon: '✨' },
  { id: 'variant02', label: 'Hoops', icon: '💫' },
  { id: 'variant03', label: 'Studs', icon: '💎' },
  { id: 'variant04', label: 'Hair Clip', icon: '🌸' },
];

export const CLOTHING_OPTIONS: ClothingOption[] = [
  { id: 'variant01', label: 'Cozy Tee', icon: '👕' },
  { id: 'variant02', label: 'Knit Sweater', icon: '🧶' },
  { id: 'variant03', label: 'Minimal Top', icon: '🎽' },
  { id: 'variant05', label: 'Collared', icon: '👔' },
  { id: 'variant08', label: 'Robe / Kimono', icon: '👘' },
  { id: 'variant14', label: 'Hoodie', icon: '🧥' },
];

export const CLOTHING_COLORS: ClothingColorOption[] = [
  { id: '7d9d8b', label: 'Sage Green', color: '#7D9D8B' },
  { id: 'c86d51', label: 'Terracotta', color: '#C86D51' },
  { id: '333333', label: 'Charcoal', color: '#333333' },
  { id: 'e8dfc8', label: 'Oat Cream', color: '#E8DFC8' },
  { id: 'd89595', label: 'Soft Rose', color: '#D89595' },
  { id: '9c8eb9', label: 'Soft Lilac', color: '#9C8EB9' },
];

export const BG_COLORS: BgColorOption[] = [
  { id: 'dce8de', label: 'Sage Tint', color: '#DCE8DE' },
  { id: 'f7f2e7', label: 'Cream Tint', color: '#F7F2E7' },
  { id: 'fce6eb', label: 'Soft Pink', color: '#FCE6EB' },
  { id: 'ebe5f7', label: 'Lavender', color: '#EBE5F7' },
  { id: 'fce8d5', label: 'Peach Tint', color: '#FCE8D5' },
  { id: '2d221d', label: 'Dark Roast', color: '#2D221D' },
];

export const DEFAULT_PIXEL_AVATAR: PixelAvatarConfig = {
  skinColor: 'ffd8b4',
  skinTone: '#FFD8B4',
  hair: 'long16',
  hairStyle: 'long16',
  hairColor: '28150a',
  glasses: 'none',
  accessories: 'none',
  clothing: 'variant01',
  clothingColor: '7d9d8b',
  outfitColor: '#7D9D8B',
  backgroundColor: 'dce8de',
  bgColor: '#DCE8DE',
};

/**
 * Clean hex string to bare lowercase hex without '#'
 */
export const cleanHex = (val?: string, fallback: string = 'dce8de'): string => {
  if (!val) return fallback;
  return val.replace(/^#/, '').toLowerCase();
};

/**
 * Generate DiceBear pixel-art SVG string completely offline
 */
export const getPixelAvatarSvg = (config: PixelAvatarConfig = {}): string => {
  const skin = cleanHex(config.skinColor || config.skinTone, 'ffd8b4');

  let hairStyle = config.hair || config.hairStyle || 'long16';
  // Map legacy names if present
  if (hairStyle === 'bun') hairStyle = 'long16';
  else if (hairStyle === 'bob') hairStyle = 'short05';
  else if (hairStyle === 'long') hairStyle = 'long01';
  else if (hairStyle === 'ponytail') hairStyle = 'long08';

  const hairCol = cleanHex(config.hairColor, '28150a');

  let glassesStyle = config.glasses || 'none';
  if (glassesStyle === 'round') glassesStyle = 'light01';
  else if (glassesStyle === 'square') glassesStyle = 'dark01';
  else if (glassesStyle === 'sunglasses') glassesStyle = 'dark03';

  const hasGlasses = Boolean(glassesStyle && glassesStyle !== 'none');

  const acc = config.accessories || 'none';
  const hasAcc = Boolean(acc && acc !== 'none');

  const clothingVariant = config.clothing || 'variant01';
  const clothingCol = cleanHex(config.clothingColor || config.outfitColor, '7d9d8b');
  const bg = cleanHex(config.backgroundColor || config.bgColor, 'dce8de');

  const options: Record<string, any> = {
    skinColor: [skin],
    hair: [hairStyle],
    hairColor: [hairCol],
    clothing: [clothingVariant],
    clothingColor: [clothingCol],
    backgroundColor: [bg],
    glassesProbability: hasGlasses ? 100 : 0,
    accessoriesProbability: hasAcc ? 100 : 0,
  };

  if (hasGlasses) {
    options.glasses = [glassesStyle];
  }
  if (hasAcc) {
    options.accessories = [acc];
  }

  return createAvatar(pixelArt, options).toString();
};

export interface PixelAvatarProps {
  config?: PixelAvatarConfig;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Upgraded PixelAvatar Component
 * Powered by DiceBear Pixel Art for high-detail, offline-first vector avatars
 */
export const PixelAvatar: React.FC<PixelAvatarProps> = ({
  config = DEFAULT_PIXEL_AVATAR,
  size = 48,
  style,
}) => {
  const svgXml = useMemo(() => {
    try {
      return getPixelAvatarSvg(config);
    } catch (e) {
      console.error('Error generating DiceBear pixel-art SVG:', e);
      return '';
    }
  }, [
    config?.skinColor,
    config?.skinTone,
    config?.hair,
    config?.hairStyle,
    config?.hairColor,
    config?.glasses,
    config?.accessories,
    config?.clothing,
    config?.clothingColor,
    config?.outfitColor,
    config?.backgroundColor,
    config?.bgColor,
  ]);

  const bgHex = config?.backgroundColor || config?.bgColor || 'dce8de';
  const backgroundColor = bgHex.startsWith('#') ? bgHex : `#${bgHex}`;

  return (
    <View
      style={[
        styles.circleContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      {svgXml ? <SvgXml xml={svgXml} width={size} height={size} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  circleContainer: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PixelAvatar;
