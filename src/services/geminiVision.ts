import { ProductCategory, RoutineType, MaskType } from '../types/product';

export interface GeminiVisionResult {
  name: string;
  brand: string;
  category: ProductCategory;
  routineType: RoutineType;
  maskType?: MaskType;
}

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-3-flash-preview';

/**
 * Clean potential markdown wrappers or code fences from Gemini output
 */
const extractJsonString = (text: string): string => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }
  return cleaned;
};

/**
 * Normalize category string to valid ProductCategory
 */
export const normalizeCategory = (cat?: string): ProductCategory => {
  if (!cat) return 'serum';
  const clean = cat.toLowerCase().trim();
  if (clean.includes('cleanse') || clean.includes('wash') || clean.includes('foam')) return 'cleanser';
  if (clean.includes('tone') || clean.includes('astringent')) return 'toner';
  if (clean.includes('serum') || clean.includes('ampoule') || clean.includes('active')) return 'serum';
  if (clean.includes('moistur') || clean.includes('cream') || clean.includes('lotion')) return 'moisturizer';
  if (clean.includes('sun') || clean.includes('spf') || clean.includes('uv') || clean.includes('shield')) return 'sunscreen';
  if (clean.includes('mask') || clean.includes('sheet') || clean.includes('peel') || clean.includes('clay')) return 'masks_treatments';
  if (clean.includes('eye')) return 'eye_cream';
  if (clean.includes('exfoli') || clean.includes('scrub') || clean.includes('aha') || clean.includes('bha')) return 'exfoliant';
  if (clean.includes('oil')) return 'facial_oil';
  return 'serum';
};

/**
 * Normalize routine time string to RoutineType
 */
export const normalizeRoutineType = (time?: string): RoutineType => {
  if (!time) return 'both';
  const clean = time.toLowerCase().trim();
  if (clean === 'morning' || clean === 'am') return 'am';
  if (clean === 'evening' || clean === 'pm' || clean === 'night') return 'pm';
  return 'both';
};

/**
 * Normalize mask type string
 */
export const normalizeMaskType = (type?: string): MaskType | undefined => {
  if (!type) return undefined;
  const clean = type.toLowerCase().trim();
  if (clean.includes('eye')) return 'under_eye';
  if (clean.includes('clay') || clean.includes('peel')) return 'clay_peel';
  if (clean.includes('face') || clean.includes('sheet')) return 'full_face';
  return 'full_face';
};

/**
 * Analyze skincare product image using Google Gemini Vision REST API.
 * Uses process.env.EXPO_PUBLIC_GEMINI_API_KEY.
 */
export const analyzeProductWithGemini = async (
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<GeminiVisionResult> => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is missing (EXPO_PUBLIC_GEMINI_API_KEY).');
  }

  const prompt = `You are a professional skincare and cosmetic product identifier.
Analyze this photo of a skincare product packaging, bottle, or tube.
Identify the product details accurately.

Return ONLY a valid JSON object (no markdown, no backticks, no code fences, no extra text) with these exact fields:
- "name": Product name (string, e.g. "Niacinamide 10% + Zinc 1%")
- "brand": Brand name (string, e.g. "The Ordinary")
- "category": Must match one of: "Cleanser", "Toner", "Serum", "Moisturizer", "Sunscreen", "Mask", "Eye Cream", "Exfoliant", or "Other"
- "routineTime": Recommended daily usage: "morning", "evening", or "both"
- "maskType": Only if category is "Mask", choose one of: "full_face", "under_eye", or "clay_peel". Otherwise null.
`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  };

  const callModel = async (model: string) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  };

  // Call Gemini REST API with primary model (gemini-2.5-flash)
  let response = await callModel(PRIMARY_MODEL);

  // If primary model returns 404, gracefully fall back to latest preview model
  if (!response.ok && response.status === 404) {
    console.warn(`Model ${PRIMARY_MODEL} returned 404, attempting fallback with ${FALLBACK_MODEL}...`);
    response = await callModel(FALLBACK_MODEL);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini API returned empty response.');
  }

  const jsonStr = extractJsonString(rawText);
  const parsed = JSON.parse(jsonStr);

  const category = normalizeCategory(parsed.category);
  const routineType = normalizeRoutineType(parsed.routineTime);
  const maskType =
    category === 'masks_treatments'
      ? normalizeMaskType(parsed.maskType) || 'full_face'
      : undefined;

  return {
    name: parsed.name ? String(parsed.name).trim() : '',
    brand: parsed.brand ? String(parsed.brand).trim() : '',
    category,
    routineType,
    maskType,
  };
};
