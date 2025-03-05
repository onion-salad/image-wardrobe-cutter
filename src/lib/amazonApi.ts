
// Amazon Product Advertising APIクライアント
import crypto from 'crypto';

interface AmazonCredentials {
  accessKey: string;
  secretKey: string;
  partnerTag: string; // Amazonアソシエイトタグ
  region: string;  // 例: 'jp' または 'us'
}

interface SearchParams {
  keywords: string;
  searchIndex?: string; // 例: 'All', 'Fashion', 'Apparel'など
  resources?: string[]; // 返却して欲しいリソース (例: 'Images.Primary.Medium', 'ItemInfo.Title')
}

interface ProductSearchResult {
  title: string;
  brand?: string;
  price?: string;
  imageUrl?: string;
  productUrl?: string;
  asin?: string;
}

// 一時的に保存されるAmazon API認証情報（実際の運用では安全に管理が必要）
let amazonCredentials: AmazonCredentials | null = null;

// API認証情報を設定
export const setAmazonCredentials = (credentials: AmazonCredentials) => {
  amazonCredentials = credentials;
  
  // localStorageに保存（注意: 本番環境ではより安全な方法を検討する）
  localStorage.setItem('amazonApiCredentials', JSON.stringify(credentials));
  
  return true;
};

// 保存された認証情報を読み込む
export const loadAmazonCredentials = (): AmazonCredentials | null => {
  if (amazonCredentials) {
    return amazonCredentials;
  }
  
  const saved = localStorage.getItem('amazonApiCredentials');
  if (saved) {
    try {
      amazonCredentials = JSON.parse(saved);
      return amazonCredentials;
    } catch (e) {
      console.error('認証情報の読み込みに失敗しました:', e);
    }
  }
  
  return null;
};

// Amazon Product Advertising API v5 リクエストに必要な署名を生成
const generateSignature = (
  credentials: AmazonCredentials,
  method: string,
  path: string,
  payload: string,
  timestamp: string
) => {
  // Amazon APIに必要なヘッダー情報
  const hostName = `webservices.amazon.${credentials.region}`;
  
  // 署名用の文字列を作成
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    timestamp,
    `${timestamp.substr(0, 8)}/${credentials.region}/ProductAdvertisingAPI/aws4_request`,
    crypto
      .createHash('sha256')
      .update(
        `${method}\n${path}\n\nhost:${hostName}\nx-amz-date:${timestamp}\n\nhost;x-amz-date\n${crypto
          .createHash('sha256')
          .update(payload)
          .digest('hex')}`
      )
      .digest('hex')
  ].join('\n');
  
  // 署名を計算
  const date = crypto
    .createHmac('sha256', `AWS4${credentials.secretKey}`)
    .update(timestamp.substr(0, 8))
    .digest();
  
  const region = crypto
    .createHmac('sha256', date)
    .update(credentials.region)
    .digest();
  
  const service = crypto
    .createHmac('sha256', region)
    .update('ProductAdvertisingAPI')
    .digest();
  
  const signing = crypto
    .createHmac('sha256', service)
    .update('aws4_request')
    .digest();
  
  const signature = crypto
    .createHmac('sha256', signing)
    .update(stringToSign)
    .digest('hex');
  
  return signature;
};

// Amazon Product Advertising APIで商品を検索
export const searchProducts = async (
  params: SearchParams
): Promise<ProductSearchResult[]> => {
  const creds = loadAmazonCredentials();
  if (!creds) {
    throw new Error('Amazon API認証情報が設定されていません');
  }
  
  try {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const path = '/paapi5/searchitems';
    
    // デフォルトの検索リソース
    const defaultResources = [
      'Images.Primary.Medium',
      'ItemInfo.Title',
      'ItemInfo.ByLineInfo',
      'Offers.Listings.Price',
      'Offers.Listings.Availability.Type'
    ];
    
    // リクエスト本文を作成
    const payload = JSON.stringify({
      Keywords: params.keywords,
      SearchIndex: params.searchIndex || 'All',
      Resources: params.resources || defaultResources,
      PartnerTag: creds.partnerTag,
      PartnerType: 'Associates',
      Marketplace: `www.amazon.${creds.region}`
    });
    
    // 署名を生成
    const signature = generateSignature(creds, 'POST', path, payload, timestamp);
    
    // APIリクエスト
    const response = await fetch(`https://webservices.amazon.${creds.region}/paapi5/searchitems`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Date': timestamp,
        'Authorization': `AWS4-HMAC-SHA256 Credential=${
          creds.accessKey
        }/${timestamp.substr(0, 8)}/${
          creds.region
        }/ProductAdvertisingAPI/aws4_request, SignedHeaders=host;x-amz-date, Signature=${signature}`
      },
      body: payload
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Amazon API エラー: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // レスポンスを解析して結果を整形
    const results: ProductSearchResult[] = [];
    
    if (data.SearchResult && data.SearchResult.Items) {
      for (const item of data.SearchResult.Items) {
        results.push({
          title: item.ItemInfo?.Title?.DisplayValue || '不明',
          brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
          price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount,
          imageUrl: item.Images?.Primary?.Medium?.URL,
          productUrl: item.DetailPageURL,
          asin: item.ASIN
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Amazon Product API検索エラー:', error);
    return [];
  }
};

// 画像を元に製品検索（検出されたカテゴリとテキストを使用）
export const searchProductsByImage = async (
  category: string,
  detectedText?: string
): Promise<ProductSearchResult[]> => {
  let keywords = category;
  
  // テキストが検出された場合、それも検索キーワードに追加
  if (detectedText) {
    // テキストからブランド名や製品名と思われる部分を抽出
    const textParts = detectedText.split(' ');
    const filteredParts = textParts.filter(part => 
      part.length > 2 && !/^[0-9]+$/.test(part)
    );
    
    if (filteredParts.length > 0) {
      // 最大3つの単語を追加
      const additionalKeywords = filteredParts.slice(0, 3).join(' ');
      keywords = `${additionalKeywords} ${category}`;
    }
  }
  
  // カテゴリに適した検索インデックスを決定
  let searchIndex = 'All';
  if (/シャツ|トップ|ブラウス|セーター|ジャケット/.test(category)) {
    searchIndex = 'Apparel';
  } else if (/パンツ|ズボン|ジーンズ|スカート/.test(category)) {
    searchIndex = 'Apparel';
  } else if (/靴|スニーカー|ブーツ|サンダル/.test(category)) {
    searchIndex = 'Shoes';
  } else if (/バッグ|かばん|リュック|ポーチ/.test(category)) {
    searchIndex = 'Luggage';
  }
  
  return searchProducts({
    keywords,
    searchIndex,
  });
};

