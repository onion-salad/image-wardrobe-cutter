
import { loadImage, removeBackground } from '@/lib/transformers';
import { classifyImage, classifyImageWithGoogleVision } from '@/lib/classification';

// 拡張されたアイテム型定義
export interface DetectedItem {
  type: 'top' | 'bottom' | 'shoes' | 'bag';
  imageUrl: string;
  blob: Blob;
  classification?: string; // 詳細な分類結果
  confidence?: number;    // 分類の信頼度
}

// Helper function to create cropped image
const cropImage = (img: HTMLImageElement, x: number, y: number, width: number, height: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/png');
    } catch (error) {
      reject(error);
    }
  });
};

// This is a simplified version - in a real app this would use MediaPipe Pose
export const processImage = async (file: File): Promise<DetectedItem[]> => {
  try {
    // Load the image
    const img = await loadImage(file);
    
    // Since we can't use MediaPipe in the browser directly,
    // we'll simulate the detection with pre-defined crops
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    
    // Simple mock of pose detection
    // In a real app, we would use MediaPipe to detect body keypoints
    const topY = imgHeight * 0.1;
    const topHeight = imgHeight * 0.3;
    
    const bottomY = imgHeight * 0.4;
    const bottomHeight = imgHeight * 0.4;
    
    const shoesY = imgHeight * 0.8;
    const shoesHeight = imgHeight * 0.2;
    
    // For bag, we'll take a region on the side
    const bagX = imgWidth * 0.7;
    const bagWidth = imgWidth * 0.3;
    
    // Create crop regions
    const topBlob = await cropImage(img, 0, topY, imgWidth, topHeight);
    const bottomBlob = await cropImage(img, 0, bottomY, imgWidth, bottomHeight);
    const shoesBlob = await cropImage(img, 0, shoesY, imgWidth, shoesHeight);
    const bagBlob = await cropImage(img, bagX, imgHeight * 0.3, bagWidth, imgHeight * 0.4);
    
    // Create URLs for the blobs
    const results: DetectedItem[] = [
      {
        type: 'top',
        imageUrl: URL.createObjectURL(topBlob),
        blob: topBlob
      },
      {
        type: 'bottom',
        imageUrl: URL.createObjectURL(bottomBlob),
        blob: bottomBlob
      },
      {
        type: 'shoes',
        imageUrl: URL.createObjectURL(shoesBlob),
        blob: shoesBlob
      },
      {
        type: 'bag',
        imageUrl: URL.createObjectURL(bagBlob),
        blob: bagBlob
      }
    ];
    
    // 分類処理を実行
    const classifiedResults = await classifyItems(results);
    
    return classifiedResults;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
};

// 各アイテムを分類
const classifyItems = async (items: DetectedItem[]): Promise<DetectedItem[]> => {
  try {
    // Google Vision APIを使用
    const useGoogleVision = true; // この変数を使って切り替え可能にする
    
    const classifiedItems = await Promise.all(
      items.map(async (item) => {
        try {
          let classification;
          
          if (useGoogleVision) {
            // Google Vision APIを使用
            classification = await classifyImageWithGoogleVision(item.blob);
          } else {
            // 画像の種類によって適切なカテゴリを指定
            const category = getCategoryForType(item.type);
            // ブラウザ内分類を実行
            classification = await classifyImage(item.imageUrl, category);
          }
          
          return {
            ...item,
            classification: classification.label,
            confidence: classification.score
          };
        } catch (error) {
          console.error(`Error classifying ${item.type}:`, error);
          return item; // エラーの場合は元のアイテムを返す
        }
      })
    );
    
    return classifiedItems;
  } catch (error) {
    console.error('Error in classification process:', error);
    return items; // エラーの場合は元のアイテムを返す
  }
};

// アイテムの種類に基づいて分類カテゴリを決定
const getCategoryForType = (type: 'top' | 'bottom' | 'shoes' | 'bag'): string => {
  switch (type) {
    case 'top':
      return 'upper_clothes';
    case 'bottom':
      return 'lower_clothes';
    case 'shoes':
      return 'footwear';
    case 'bag':
      return 'bag';
    default:
      return 'fashion';
  }
};

// Download function
export const downloadImage = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
