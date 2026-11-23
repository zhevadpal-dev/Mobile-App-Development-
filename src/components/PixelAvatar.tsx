import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { PixelAvatarConfig } from '../types/auth';

export interface SkinToneOption {
  id: string;
  label: string;
  color: string;
  shadow: string;
}

export interface HairStyleOption {
  id: 'bun' | 'long' | 'bob' | 'ponytail';
  label: string;
  icon: string;
}

export interface HairColorOption {
  id: string;
  label: string;
  color: string;
}

export interface GlassesOption {
  id: 'none' | 'round' | 'square' | 'sunglasses';
  label: string;
  icon: string;
}

export interface OutfitColorOption {
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
  { id: 'porcelain', label: 'Porcelain', color: '#FDDFCA', shadow: '#E2BC9E' },
  { id: 'peach', label: 'Warm Peach', color: '#F5C7A5', shadow: '#D9A47B' },
  { id: 'honey', label: 'Golden Honey', color: '#DFA878', shadow: '#BD8353' },
  { id: 'chestnut', label: 'Rich Tan', color: '#A86E45', shadow: '#8B512B' },
  { id: 'espresso', label: 'Deep Espresso', color: '#65432B', shadow: '#4D2F1B' },
];

export const HAIR_STYLES: HairStyleOption[] = [
  { id: 'bun', label: 'Messy Bun', icon: '🍡' },
  { id: 'long', label: 'Long Waves', icon: '✨' },
  { id: 'bob', label: 'Short Bob', icon: '🌿' },
  { id: 'ponytail', label: 'Ponytail', icon: '🎀' },
];

export const HAIR_COLORS: HairColorOption[] = [
  { id: 'darkBrown', label: 'Dark Brown', color: '#3E2723' },
  { id: 'softBlack', label: 'Soft Black', color: '#1F1F1F' },
  { id: 'blonde', label: 'Golden Blonde', color: '#E4BA76' },
  { id: 'auburn', label: 'Auburn', color: '#9E472A' },
  { id: 'softPink', label: 'Soft Pink', color: '#E89EB8' },
  { id: 'silver', label: 'Platinum Silver', color: '#B0B3B8' },
];

export const GLASSES_OPTIONS: GlassesOption[] = [
  { id: 'none', label: 'None', icon: '✕' },
  { id: 'round', label: 'Round Gold', icon: '👓' },
  { id: 'square', label: 'Square Black', icon: '🕶️' },
  { id: 'sunglasses', label: 'Sunglasses', icon: '🕶' },
];

export const OUTFIT_COLORS: OutfitColorOption[] = [
  { id: 'sage', label: 'Sage Green', color: '#7D9D8B' },
  { id: 'charcoal', label: 'Charcoal', color: '#333333' },
  { id: 'cream', label: 'Oat Cream', color: '#E8DFC8' },
  { id: 'softPink', label: 'Soft Rose', color: '#D89595' },
  { id: 'terracotta', label: 'Terracotta', color: '#C86D51' },
  { id: 'lavender', label: 'Soft Lilac', color: '#9C8EB9' },
];

export const BG_COLORS: BgColorOption[] = [
  { id: 'sage', label: 'Sage Tint', color: '#DCE8DE' },
  { id: 'cream', label: 'Cream Tint', color: '#F7F2E7' },
  { id: 'softPink', label: 'Soft Pink', color: '#FCE6EB' },
  { id: 'lavender', label: 'Lavender', color: '#EBE5F7' },
  { id: 'peach', label: 'Peach Tint', color: '#FCE8D5' },
  { id: 'darkEspresso', label: 'Dark Roast', color: '#2D221D' },
];

export const DEFAULT_PIXEL_AVATAR: PixelAvatarConfig = {
  skinTone: '#FDDFCA',
  hairStyle: 'bun',
  hairColor: '#3E2723',
  glasses: 'none',
  outfitColor: '#7D9D8B',
  bgColor: '#DCE8DE',
};

const getSkinShadow = (skinColor: string): string => {
  const match = SKIN_TONES.find(s => s.color.toLowerCase() === skinColor.toLowerCase());
  return match ? match.shadow : '#D9A47B';
};

export interface PixelAvatarProps {
  config?: PixelAvatarConfig;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * PixelAvatar Component
 * Renders a crisp 24x24 pixel art portrait layered with SVG rects
 */
export const PixelAvatar: React.FC<PixelAvatarProps> = ({
  config = DEFAULT_PIXEL_AVATAR,
  size = 48,
  style,
}) => {
  const skinTone = config.skinTone || DEFAULT_PIXEL_AVATAR.skinTone;
  const skinShadow = getSkinShadow(skinTone);
  const hairColor = config.hairColor || DEFAULT_PIXEL_AVATAR.hairColor;
  const hairStyle = config.hairStyle || DEFAULT_PIXEL_AVATAR.hairStyle;
  const glasses = config.glasses || DEFAULT_PIXEL_AVATAR.glasses;
  const outfitColor = config.outfitColor || DEFAULT_PIXEL_AVATAR.outfitColor;
  const bgColor = config.bgColor || DEFAULT_PIXEL_AVATAR.bgColor;

  return (
    <View
      style={[
        styles.circleContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {/* ======================================================== */}
        {/* Layer 1: Background Fill                                */}
        {/* ======================================================== */}
        <Rect x={0} y={0} width={24} height={24} fill={bgColor} />

        {/* ======================================================== */}
        {/* Layer 2: Hair Back (Behind Neck & Body)                 */}
        {/* ======================================================== */}
        {hairStyle === 'long' && (
          <>
            <Rect x={4} y={11} width={3} height={13} fill={hairColor} />
            <Rect x={17} y={11} width={3} height={13} fill={hairColor} />
            <Rect x={5} y={23} width={2} height={1} fill={hairColor} />
            <Rect x={17} y={23} width={2} height={1} fill={hairColor} />
          </>
        )}

        {hairStyle === 'ponytail' && (
          <>
            <Rect x={15} y={5} width={4} height={2} fill={hairColor} />
            <Rect x={17} y={7} width={4} height={4} fill={hairColor} />
            <Rect x={18} y={11} width={4} height={6} fill={hairColor} />
            <Rect x={19} y={17} width={2} height={2} fill={hairColor} />
          </>
        )}

        {/* ======================================================== */}
        {/* Layer 3: Body & Outfit                                  */}
        {/* ======================================================== */}
        {/* Shoulders */}
        <Rect x={8} y={17} width={3} height={1} fill={outfitColor} />
        <Rect x={13} y={17} width={3} height={1} fill={outfitColor} />
        <Rect x={5} y={18} width={6} height={1} fill={outfitColor} />
        <Rect x={13} y={18} width={6} height={1} fill={outfitColor} />
        <Rect x={11} y={18} width={2} height={1} fill={outfitColor} opacity={0.85} />
        <Rect x={4} y={19} width={16} height={1} fill={outfitColor} />
        <Rect x={2} y={20} width={20} height={4} fill={outfitColor} />

        {/* ======================================================== */}
        {/* Layer 4: Neck & Face Base (Skin)                        */}
        {/* ======================================================== */}
        {/* Neck */}
        <Rect x={10} y={15} width={4} height={2} fill={skinTone} />
        <Rect x={10} y={15} width={4} height={1} fill={skinShadow} />
        {/* Open collar skin notch */}
        <Rect x={11} y={17} width={2} height={1} fill={skinTone} />

        {/* Forehead & Face */}
        <Rect x={8} y={7} width={8} height={1} fill={skinTone} />
        <Rect x={7} y={8} width={10} height={6} fill={skinTone} />
        {/* Jaw & Chin */}
        <Rect x={8} y={14} width={8} height={1} fill={skinTone} />
        <Rect x={9} y={15} width={6} height={1} fill={skinTone} />

        {/* ======================================================== */}
        {/* Layer 5: Face Details (Eyes, Catchlights, Blush, Lips)  */}
        {/* ======================================================== */}
        {/* Left Eye */}
        <Rect x={9} y={11} width={1} height={1} fill="#FFFFFF" />
        <Rect x={10} y={11} width={1} height={1} fill="#1D1A19" />
        <Rect x={9} y={12} width={2} height={1} fill="#1D1A19" />

        {/* Right Eye */}
        <Rect x={13} y={11} width={1} height={1} fill="#FFFFFF" />
        <Rect x={14} y={11} width={1} height={1} fill="#1D1A19" />
        <Rect x={13} y={12} width={2} height={1} fill="#1D1A19" />

        {/* Cute Pink Blush */}
        <Rect x={7} y={13} width={2} height={1} fill="#FF8BA7" opacity={0.75} />
        <Rect x={15} y={13} width={2} height={1} fill="#FF8BA7" opacity={0.75} />

        {/* Cute Subtle Lip Smile */}
        <Rect x={11} y={14} width={2} height={1} fill="#D16373" />

        {/* Subtle Nose Shadow */}
        <Rect x={11} y={13} width={2} height={1} fill={skinShadow} opacity={0.5} />

        {/* ======================================================== */}
        {/* Layer 6: Hair Front (Bangs, Top Bun, Sides)             */}
        {/* ======================================================== */}
        {hairStyle === 'bun' && (
          <>
            {/* Top Bun */}
            <Rect x={10} y={2} width={4} height={1} fill={hairColor} />
            <Rect x={9} y={3} width={6} height={3} fill={hairColor} />
            <Rect x={10} y={6} width={4} height={1} fill={hairColor} />
            {/* Bun Hair Tie / Scrunchie */}
            <Rect x={11} y={6} width={2} height={1} fill={outfitColor} />
            {/* Top Volume & Hairline */}
            <Rect x={8} y={5} width={8} height={1} fill={hairColor} />
            <Rect x={7} y={6} width={10} height={1} fill={hairColor} />
            <Rect x={6} y={7} width={12} height={2} fill={hairColor} />
            {/* Parted Bangs */}
            <Rect x={6} y={9} width={4} height={1} fill={hairColor} />
            <Rect x={14} y={9} width={4} height={1} fill={hairColor} />
            {/* Face framing tendrils */}
            <Rect x={6} y={10} width={1} height={4} fill={hairColor} />
            <Rect x={17} y={10} width={1} height={4} fill={hairColor} />
            {/* Cute stray wisps on bun */}
            <Rect x={8} y={3} width={1} height={1} fill={hairColor} opacity={0.8} />
            <Rect x={15} y={4} width={1} height={1} fill={hairColor} opacity={0.8} />
          </>
        )}

        {hairStyle === 'long' && (
          <>
            {/* Top Volume */}
            <Rect x={8} y={5} width={8} height={1} fill={hairColor} />
            <Rect x={7} y={6} width={10} height={1} fill={hairColor} />
            <Rect x={6} y={7} width={12} height={2} fill={hairColor} />
            {/* Bangs */}
            <Rect x={6} y={9} width={4} height={1} fill={hairColor} />
            <Rect x={14} y={9} width={4} height={1} fill={hairColor} />
            {/* Front Waves */}
            <Rect x={5} y={10} width={2} height={9} fill={hairColor} />
            <Rect x={17} y={10} width={2} height={9} fill={hairColor} />
          </>
        )}

        {hairStyle === 'bob' && (
          <>
            {/* Top Volume */}
            <Rect x={8} y={5} width={8} height={1} fill={hairColor} />
            <Rect x={7} y={6} width={10} height={1} fill={hairColor} />
            <Rect x={6} y={7} width={12} height={2} fill={hairColor} />
            {/* Bangs */}
            <Rect x={6} y={9} width={4} height={1} fill={hairColor} />
            <Rect x={14} y={9} width={4} height={1} fill={hairColor} />
            {/* Bob Sides */}
            <Rect x={5} y={10} width={2} height={5} fill={hairColor} />
            <Rect x={17} y={10} width={2} height={5} fill={hairColor} />
            {/* Inward curve at chin */}
            <Rect x={6} y={14} width={2} height={2} fill={hairColor} />
            <Rect x={16} y={14} width={2} height={2} fill={hairColor} />
          </>
        )}

        {hairStyle === 'ponytail' && (
          <>
            {/* Top Volume */}
            <Rect x={8} y={5} width={8} height={1} fill={hairColor} />
            <Rect x={7} y={6} width={10} height={1} fill={hairColor} />
            <Rect x={6} y={7} width={12} height={2} fill={hairColor} />
            {/* Scrunchie */}
            <Rect x={15} y={5} width={2} height={2} fill={outfitColor} />
            {/* Swept Bangs */}
            <Rect x={6} y={9} width={3} height={1} fill={hairColor} />
            <Rect x={15} y={9} width={3} height={1} fill={hairColor} />
            {/* Wisps */}
            <Rect x={6} y={10} width={1} height={3} fill={hairColor} />
            <Rect x={17} y={10} width={1} height={2} fill={hairColor} />
          </>
        )}

        {/* ======================================================== */}
        {/* Layer 7: Glasses / Accessories                          */}
        {/* ======================================================== */}
        {glasses === 'round' && (
          <>
            {/* Left Frame */}
            <Rect x={8} y={10} width={4} height={1} fill="#E6BE65" />
            <Rect x={8} y={13} width={4} height={1} fill="#E6BE65" />
            <Rect x={8} y={11} width={1} height={2} fill="#E6BE65" />
            <Rect x={11} y={11} width={1} height={2} fill="#E6BE65" />

            {/* Right Frame */}
            <Rect x={12} y={10} width={4} height={1} fill="#E6BE65" />
            <Rect x={12} y={13} width={4} height={1} fill="#E6BE65" />
            <Rect x={12} y={11} width={1} height={2} fill="#E6BE65" />
            <Rect x={15} y={11} width={1} height={2} fill="#E6BE65" />

            {/* Bridge & Temples */}
            <Rect x={11} y={11} width={2} height={1} fill="#E6BE65" />
            <Rect x={7} y={11} width={1} height={1} fill="#E6BE65" />
            <Rect x={16} y={11} width={1} height={1} fill="#E6BE65" />
          </>
        )}

        {glasses === 'square' && (
          <>
            {/* Left Frame */}
            <Rect x={8} y={10} width={4} height={1} fill="#222222" />
            <Rect x={8} y={13} width={4} height={1} fill="#222222" />
            <Rect x={8} y={11} width={1} height={2} fill="#222222" />
            <Rect x={11} y={11} width={1} height={2} fill="#222222" />

            {/* Right Frame */}
            <Rect x={12} y={10} width={4} height={1} fill="#222222" />
            <Rect x={12} y={13} width={4} height={1} fill="#222222" />
            <Rect x={12} y={11} width={1} height={2} fill="#222222" />
            <Rect x={15} y={11} width={1} height={2} fill="#222222" />

            {/* Bridge & Temples */}
            <Rect x={11} y={11} width={2} height={1} fill="#222222" />
            <Rect x={7} y={11} width={1} height={1} fill="#222222" />
            <Rect x={16} y={11} width={1} height={1} fill="#222222" />
          </>
        )}

        {glasses === 'sunglasses' && (
          <>
            {/* Left Dark Lens */}
            <Rect x={8} y={10} width={4} height={4} fill="#191919" />
            <Rect x={9} y={10} width={1} height={1} fill="#FFFFFF" opacity={0.65} />

            {/* Right Dark Lens */}
            <Rect x={12} y={10} width={4} height={4} fill="#191919" />
            <Rect x={13} y={10} width={1} height={1} fill="#FFFFFF" opacity={0.65} />

            {/* Bridge & Temples */}
            <Rect x={11} y={11} width={2} height={1} fill="#191919" />
            <Rect x={7} y={11} width={1} height={1} fill="#191919" />
            <Rect x={16} y={11} width={1} height={1} fill="#191919" />
          </>
        )}
      </Svg>
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
