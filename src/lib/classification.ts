
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
    // 分類器をロードする（初回のみ）
    if (!classifier) {
      console.log('画像分類モデルをロード中...');
      classifier = await pipeline(
        'image-classification',
        'onnx-community/mobilenetv4_conv_small.e2400_r224_in1k', // 軽量モデルを使用
        { device: 'cpu' } // WebGPUがない場合はCPUにフォールバック
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
    return { label: '不明', score: 0 };
  }
};
