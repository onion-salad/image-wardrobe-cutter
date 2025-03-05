
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Tag, AlertTriangle, Cloud, Info, ShoppingBag, ExternalLink } from 'lucide-react';
import { DetectedItem, downloadImage } from '@/utils/imageProcessing';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AmazonApiSetup from './AmazonApiSetup';
import { loadAmazonCredentials } from '@/lib/amazonApi';

interface ResultsProps {
  items: DetectedItem[];
  onReset: () => void;
  showApiError?: boolean;
  usingGoogleVision?: boolean;
}

// 商品カードコンポーネント
const ItemCard: React.FC<{ item: DetectedItem; usingGoogleVision?: boolean }> = ({ item, usingGoogleVision }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [showAmazonSetup, setShowAmazonSetup] = useState(false);
  const [hasAmazonCredentials, setHasAmazonCredentials] = useState(false);
  
  // マウント時にアマゾン認証情報を確認
  React.useEffect(() => {
    const creds = loadAmazonCredentials();
    setHasAmazonCredentials(!!creds);
  }, []);

  const typeLabels = {
    top: 'トップス',
    bottom: 'ボトムス',
    shoes: '靴',
    bag: 'バッグ'
  };

  const handleDownload = () => {
    downloadImage(item.blob, `${item.type}.png`);
  };

  const formatProductInfo = (info: string | undefined) => {
    if (!info) return null;
    
    const parts = info.split(' | ');
    
    return (
      <div className="space-y-1.5 pt-2 border-t text-xs">
        {parts.map((part, index) => {
          if (part.startsWith('商品名:')) {
            return (
              <div key={index} className="font-medium text-sm">
                <ShoppingBag className="w-3 h-3 inline mr-1" />
                {part.substring(4)}
              </div>
            );
          }
          
          if (part.startsWith('ブランド:')) {
            return (
              <div key={index} className="text-primary">
                {part}
              </div>
            );
          }
          
          return <div key={index}>{part}</div>;
        })}
      </div>
    );
  };

  // Amazon検索結果表示
  const renderAmazonResults = () => {
    if (!item.amazonResults || item.amazonResults.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground text-sm">
          <p>検索結果がありません</p>
          {!hasAmazonCredentials && (
            <Button 
              variant="link" 
              className="mt-2 text-xs"
              onClick={() => setShowAmazonSetup(true)}
            >
              Amazon API設定
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3 p-1 max-h-[180px] overflow-y-auto">
        {item.amazonResults.map((product, idx) => (
          <div key={idx} className="flex gap-2 p-2 border rounded-md text-xs hover:bg-accent">
            {product.imageUrl && (
              <img 
                src={product.imageUrl} 
                alt={product.title} 
                className="w-12 h-12 object-contain"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium line-clamp-2">{product.title}</p>
              {product.brand && <p className="text-primary text-xs">{product.brand}</p>}
              <div className="flex justify-between items-center mt-1">
                {product.price && <p className="text-muted-foreground">{product.price}</p>}
                {product.productUrl && (
                  <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="ghost" className="h-7 px-2">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Card className="overflow-hidden hover-scale">
        <div className="relative h-48 bg-muted/30 flex items-center justify-center">
          <img 
            src={item.imageUrl} 
            alt={item.type} 
            className="w-full h-full object-contain p-2"
          />
          <Badge 
            className="absolute top-2 right-2" 
            variant="secondary"
          >
            {typeLabels[item.type]}
          </Badge>
          
          {usingGoogleVision && (
            <Badge 
              className="absolute top-2 left-2" 
              variant="outline"
            >
              <Cloud className="w-3 h-3 mr-1" />
              Vision API
            </Badge>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="info">アイテム情報</TabsTrigger>
            <TabsTrigger value="amazon">商品検索</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="p-0">
            <CardContent className="p-3">
              {item.classification ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{item.classification}</span>
                    {item.confidence && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {Math.round(item.confidence * 100)}%
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          分類の信頼度
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  
                  {item.productInfo && formatProductInfo(item.productInfo)}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="w-4 h-4" />
                  <span>分類中...</span>
                </div>
              )}
            </CardContent>
          </TabsContent>
          
          <TabsContent value="amazon" className="p-0">
            {renderAmazonResults()}
          </TabsContent>
        </Tabs>
        
        <CardFooter className="p-2 bg-card flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full focus-ring"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            ダウンロード
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={showAmazonSetup} onOpenChange={setShowAmazonSetup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Amazon API設定</DialogTitle>
            <DialogDescription>
              Amazonの製品情報を取得するための認証情報を設定してください。
            </DialogDescription>
          </DialogHeader>
          <AmazonApiSetup onSetupComplete={() => {
            setShowAmazonSetup(false);
            setHasAmazonCredentials(true);
          }} />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

const Results: React.FC<ResultsProps> = ({ 
  items, 
  onReset, 
  showApiError,
  usingGoogleVision = false
}) => {
  if (items.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium">検出アイテム</h2>
        <Button variant="outline" onClick={onReset}>
          新しい画像を処理
        </Button>
      </div>

      {showApiError && !usingGoogleVision && (
        <Alert className="mb-6" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            アイテムの分類精度を向上させるには、Google Cloud Vision APIなどの外部サービスの利用をお勧めします。
            ブラウザ内のAIには限界があります。
          </AlertDescription>
        </Alert>
      )}

      {usingGoogleVision && (
        <Alert className="mb-6">
          <Cloud className="h-4 w-4" />
          <AlertDescription>
            Google Cloud Vision APIを使用して高精度な分類を行っています。Amazon製品検索タブでより詳細な商品情報を確認できます。
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <ItemCard 
            key={`${item.type}-${index}`} 
            item={item} 
            usingGoogleVision={usingGoogleVision}
          />
        ))}
      </div>
    </div>
  );
};

export default Results;
