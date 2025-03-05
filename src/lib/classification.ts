import { pipeline } from '@huggingface/transformers';
import { searchProductsByImage } from './amazonApi';

export interface ClassificationResult {
  label: string;
  score: number;
  productInfo?: string;
  amazonResults?: Array<{
    title: string;
    brand?: string;
    price?: string;
    imageUrl?: string;
    productUrl?: string;
  }>;
}

const fashionLabels: Record<string, string> = {
  'tshirt': 'Tシャツ',
  't-shirt': 'Tシャツ',
  'shirt': 'シャツ',
  'blouse': 'ブラウス',
  'sweater': 'セーター',
  'jacket': 'ジャケット',
  'coat': 'コート',
  'hoodie': 'パーカー',
  'tank top': 'タンクトップ',
  'cardigan': 'カーディガン',
  'pants': 'パンツ',
  'jeans': 'ジーンズ',
  'shorts': 'ショートパンツ',
  'skirt': 'スカート',
  'dress': 'ドレス',
  'trousers': 'ズボン',
  'leggings': 'レギンス',
  'sneakers': 'スニーカー',
  'boots': 'ブーツ',
  'heels': 'ヒール',
  'sandals': 'サンダル',
  'shoes': '靴',
  'slippers': 'スリッパ',
  'loafers': 'ローファー',
  'handbag': 'ハンドバッグ',
  'backpack': 'リュック',
  'suitcase': 'スーツケース',
  'bag': 'バッグ',
  'tote': 'トートバッグ',
  'purse': 'ポーチ',
  'clutch': 'クラッチバッグ',
  'unknown': '不明',
};

let classifier: any = null;

export const classifyImage = async (imageUrl: string, category?: string): Promise<ClassificationResult> => {
  try {
    if (imageUrl.startsWith('blob:')) {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const result = await classifyImageWithGoogleVision(blob);
      return result;
    }
    
    if (!classifier) {
      console.log('画像分類モデルをロード中...');
      classifier = await pipeline(
        'image-classification',
        'onnx-community/mobilenetv4_conv_small.e2400_r224_in1k',
        { device: 'wasm' }
      );
      console.log('分類モデルがロード完了しました');
    }

    console.log(`「${category || 'fashion'}」カテゴリで画像を分類中...`);
    const results = await classifier(imageUrl);
    
    if (!results || results.length === 0) {
      return { label: '不明', score: 0 };
    }

    const topResult = results[0];
    console.log('分類結果:', topResult);
    
    let label = '不明';
    let score = 0;

    if (topResult) {
      const rawLabel = topResult.label.split(',')[0].toLowerCase().trim();

      for (const [key, value] of Object.entries(fashionLabels)) {
        if (rawLabel.includes(key)) {
          label = value;
          score = topResult.score;
          break;
        }
      }
      
      if (label === '不明' && topResult.score > 0.3) {
        label = rawLabel;
        score = topResult.score;
      }
    }
    
    return { label, score };
  } catch (error) {
    console.error('画像分類中にエラーが発生しました:', error);
    console.log('より高精度な分類には、Google Vision APIの使用が推奨されます');
    return { label: '不明', score: 0 };
  }
};

export const classifyImageWithGoogleVision = async (imageBlob: Blob): Promise<ClassificationResult> => {
  try {
    const base64data = await blobToBase64(imageBlob);
    const imageBase64 = base64data.split(',')[1];
    const apiKey = 'AIzaSyDIK0x9Z21-B1KYURRpGWzfQ8JiEhGpxMg';
    const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    
    const requestBody = {
      requests: [
        {
          image: {
            content: imageBase64
          },
          features: [
            {
              type: 'LABEL_DETECTION',
              maxResults: 10
            },
            {
              type: 'PRODUCT_SEARCH',
              maxResults: 5
            },
            {
              type: 'LOGO_DETECTION',
              maxResults: 3
            },
            {
              type: 'WEB_DETECTION',
              maxResults: 10
            },
            {
              type: 'OBJECT_LOCALIZATION',
              maxResults: 5
            },
            {
              type: 'TEXT_DETECTION',
              maxResults: 5
            }
          ]
        }
      ]
    };

    const response = await fetch(visionApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API response: ${response.status}`);
    }

    const data = await response.json();
    console.log('Google Vision API レスポンス:', data);

    if (data.responses && data.responses[0]) {
      const response = data.responses[0];
      let label = '不明';
      let score = 0;
      let productInfo = '';
      let detectedText = '';

      if (response.labelAnnotations && response.labelAnnotations.length > 0) {
        const annotations = response.labelAnnotations;

        const fashionItems = annotations.filter((item: any) => {
          const description = item.description.toLowerCase();
          return Object.keys(fashionLabels).some(key => description.includes(key));
        });

        if (fashionItems.length > 0) {
          const topItem = fashionItems[0];
          const description = topItem.description.toLowerCase();

          for (const [key, value] of Object.entries(fashionLabels)) {
            if (description.includes(key)) {
              label = value;
              score = topItem.score;
              break;
            }
          }
        } else if (annotations.length > 0) {
          label = annotations[0].description;
          score = annotations[0].score;
        }
      }

      let brandInfo = '';
      if (response.logoAnnotations && response.logoAnnotations.length > 0) {
        brandInfo = `ブランド: ${response.logoAnnotations[0].description}`;
      }

      let productText = '';
      if (response.textAnnotations && response.textAnnotations.length > 0) {
        detectedText = response.textAnnotations[0].description;
        const text = response.textAnnotations[0].description;
        const lines = text.split('\n').slice(0, 3);
        if (lines.length > 0) {
          productText = `テキスト: ${lines.join(' ')}`;
        }
      }

      let similarProducts = '';
      let productTitle = '';
      if (response.webDetection) {
        if (response.webDetection.webEntities && response.webDetection.webEntities.length > 0) {
          const entities = response.webDetection.webEntities
            .filter((entity: any) => entity.score > 0.5)
            .slice(0, 3)
            .map((entity: any) => entity.description)
            .join(', ');
          
          if (entities) {
            similarProducts = `類似商品: ${entities}`;
          }
        }

        if (response.webDetection.pagesWithMatchingImages && 
            response.webDetection.pagesWithMatchingImages.length > 0) {
          const bestMatch = response.webDetection.pagesWithMatchingImages[0];
          if (bestMatch.pageTitle) {
            productTitle = `商品名: ${bestMatch.pageTitle.split('|')[0].trim()}`;
          }
        }
      }

      let objectInfo = '';
      if (response.localizedObjectAnnotations && response.localizedObjectAnnotations.length > 0) {
        const objects = response.localizedObjectAnnotations
          .slice(0, 2)
          .map((obj: any) => `${obj.name}(${Math.round(obj.score * 100)}%)`)
          .join(', ');
        
        if (objects) {
          objectInfo = `検出: ${objects}`;
        }
      }

      const infoItems = [productTitle, brandInfo, objectInfo, productText, similarProducts]
        .filter(Boolean);
      
      if (infoItems.length > 0) {
        productInfo = infoItems.join(' | ');
      }
      
      // Amazon商品検索を試みる
      try {
        // 検出されたラベルとテキストを使用して検索
        const amazonResults = await searchProductsByImage(label, detectedText);
        
        return {
          label: label,
          score: score,
          productInfo: productInfo,
          amazonResults: amazonResults
        };
      } catch (e) {
        // Amazonエラーの場合でも元の結果を返す
        console.error('Amazon検索エラー:', e);
        return {
          label: label,
          score: score,
          productInfo: productInfo
        };
      }
    }

    return { label: '不明', score: 0 };
  } catch (error) {
    console.error('Google Vision API呼び出し中にエラーが発生しました:', error);
    return { label: '不明', score: 0 };
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
