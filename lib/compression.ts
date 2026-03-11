/**
 * Image compression utilities.
 * All photos are compressed before being sent to the Claude API.
 *
 * - Max dimension: 1920px on the long edge (2048px for SLAB to preserve grade label legibility)
 * - JPEG quality: 85%
 * - Dev mode logs original vs compressed size
 */

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Category } from '../types/item';

const DEFAULT_MAX_DIMENSION = 1920;
const SLAB_MAX_DIMENSION = 2048; // Higher ceiling for SLAB to keep cert/grade legible
const JPEG_QUALITY = 0.85;

/**
 * Compress an image URI and return base64-encoded JPEG data.
 */
export async function compressImageToBase64(
  uri: string,
  category: Category
): Promise<{ data: string; mediaType: 'image/jpeg' }> {
  const maxDimension = category === 'SLAB' ? SLAB_MAX_DIMENSION : DEFAULT_MAX_DIMENSION;

  // Log original size in dev mode
  if (__DEV__) {
    try {
      const info = await FileSystem.getInfoAsync(uri, { size: true });
      if (info.exists && 'size' in info) {
        const originalKB = Math.round((info.size ?? 0) / 1024);
        console.log(`[Compression] Original: ${originalKB}KB`);
      }
    } catch {
      // ignore info errors
    }
  }

  // Resize and compress
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      {
        resize: {
          width: maxDimension,
          height: maxDimension,
        },
      },
    ],
    {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  if (!result.base64) {
    throw new Error('Image compression failed: no base64 output');
  }

  if (__DEV__) {
    const compressedKB = Math.round((result.base64.length * 3) / 4 / 1024);
    console.log(`[Compression] Compressed: ${compressedKB}KB (${category}, max ${maxDimension}px)`);
  }

  return {
    data: result.base64,
    mediaType: 'image/jpeg',
  };
}
