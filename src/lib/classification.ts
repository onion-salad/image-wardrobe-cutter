
import { pipeline } from '@huggingface/transformers';

// 分類結果の型定義
export interface ClassificationResult {
  label: string;
  score: number;
}

// 分類カテゴリ別の結果のマッピング
const fashionLabels: Record<string, string> = {
  // 上着
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
  
  // 下着
  'pants': 'パンツ',
  'jeans': 'ジーンズ',
  'shorts': 'ショートパンツ',
  'skirt': 'スカート',
  'dress': 'ドレス',
  'trousers': 'ズボン',
  'leggings': 'レギンス',
  
  // 靴
  'sneakers': 'スニーカー',
  'boots': 'ブーツ',
  'heels': 'ヒール',
  'sandals': 'サンダル',
  'shoes': '靴',
  'slippers': 'スリッパ',
  'loafers': 'ローファー',
  
  // バッグ
  'handbag': 'ハンドバッグ',
  'backpack': 'リュック',
  'suitcase': 'スーツケース',
  'bag': 'バッグ',
  'tote': 'トートバッグ',
  'purse': 'ポーチ',
  'clutch': 'クラッチバッグ',
  
  // その他
  'unknown': '不明',
};

// 画像分類用のモデル
let classifier: any = null;

/**
 * 画像を分類する関数
 * @param imageUrl 分類する画像のURL
 * @param category 分類カテゴリ（オプション）
 * @returns 分類結果
 */
export const classifyImage = async (imageUrl: string, category?: string): Promise<ClassificationResult> => {
  try {
    // Google Vision API を使用する
    if (imageUrl.startsWith('blob:')) {
      // Blobからデータを取得
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const result = await classifyImageWithGoogleVision(blob);
      return result;
    }
    
    // バックアップとして、ブラウザ内モデルを使用
    if (!classifier) {
      console.log('画像分類モデルをロード中...');
      
      // 重要: CPUではなくWebGPUまたはWasmを使用する
      classifier = await pipeline(
        'image-classification',
        'onnx-community/mobilenetv4_conv_small.e2400_r224_in1k',
        { device: 'wasm' } // WebGPUがサポートされていない場合はwasmを使用
      );
      
      console.log('分類モデルがロード完了しました');
    }
    
    // 画像を分類
    console.log(`「${category || 'fashion'}」カテゴリで画像を分類中...`);
    const results = await classifier(imageUrl);
    
    if (!results || results.length === 0) {
      return { label: '不明', score: 0 };
    }
    
    // 最も確率の高い結果を取得
    const topResult = results[0];
    console.log('分類結果:', topResult);
    
    // ラベルを探してローカライズ
    let label = '不明';
    let score = 0;
    
    if (topResult) {
      // ラベルからクラス名を抽出（例：'tiger, Panthera tigris' → 'tiger'）
      const rawLabel = topResult.label.split(',')[0].toLowerCase().trim();
      
      // 日本語ラベルマッピングから検索
      for (const [key, value] of Object.entries(fashionLabels)) {
        if (rawLabel.includes(key)) {
          label = value;
          score = topResult.score;
          break;
        }
      }
      
      // マッピングがない場合、元のラベルを使用
      if (label === '不明' && topResult.score > 0.3) {
        label = rawLabel;
        score = topResult.score;
      }
    }
    
    return { label, score };
  } catch (error) {
    console.error('画像分類中にエラーが発生しました:', error);
    
    // エラーが発生した場合は、Google Vision APIを使用するオプションを表示
    console.log('より高精度な分類には、Google Vision APIの使用をお勧めします');
    
    return { label: '不明', score: 0 };
  }
};

// Google Vision APIを使用した分類
export const classifyImageWithGoogleVision = async (imageBlob: Blob): Promise<ClassificationResult> => {
  try {
    // BlobをBase64に変換
    const base64data = await blobToBase64(imageBlob);
    const imageBase64 = base64data.split(',')[1]; // Base64のデータ部分だけを抽出

    // Google Cloud Vision APIリクエスト作成
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
            }
          ]
        }
      ]
    };

    // APIリクエスト送信
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

    // レスポンスから最も確率の高いラベルを取得
    if (data.responses && 
        data.responses[0] && 
        data.responses[0].labelAnnotations && 
        data.responses[0].labelAnnotations.length > 0) {
      
      const annotations = data.responses[0].labelAnnotations;
      
      // ファッション関連の項目をフィルタリング
      const fashionItems = annotations.filter((item: any) => {
        const description = item.description.toLowerCase();
        return Object.keys(fashionLabels).some(key => description.includes(key));
      });
      
      if (fashionItems.length > 0) {
        const topItem = fashionItems[0];
        const description = topItem.description.toLowerCase();
        
        // 日本語ラベルに変換
        let japaneseLabel = '不明';
        for (const [key, value] of Object.entries(fashionLabels)) {
          if (description.includes(key)) {
            japaneseLabel = value;
            break;
          }
        }
        
        return {
          label: japaneseLabel,
          score: topItem.score
        };
      }
      
      // ファッション関連アイテムが見つからない場合は最初のアノテーションを使用
      return {
        label: data.responses[0].labelAnnotations[0].description,
        score: data.responses[0].labelAnnotations[0].score
      };
    }
    
    return { label: '不明', score: 0 };
  } catch (error) {
    console.error('Google Vision API呼び出し中にエラーが発生しました:', error);
    return { label: '不明', score: 0 };
  }
};

// BlobをBase64に変換するヘルパー関数
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
