
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Tag, AlertTriangle, Cloud, Info, ShoppingBag, Sparkles } from 'lucide-react';
import { DetectedItem, downloadImage } from '@/utils/imageProcessing';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ResultsProps {
  items: DetectedItem[];
  onReset: () => void;
  showApiError?: boolean;
  usingGoogleVision?: boolean;
  usingGPT?: boolean;
}

const ItemCard: React.FC<{ item: DetectedItem; usingGoogleVision?: boolean; usingGPT?: boolean }> = ({ 
  item, 
  usingGoogleVision,
  usingGPT
}) => {
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
    
    if (usingGPT) {
      // GPT-4の詳細な分析結果を整形して表示
      return (
        <div className="space-y-1.5 pt-2 border-t text-sm">
          {info.split('\n').map((line, index) => {
            if (line.trim() === '') return null;
            
            if (index === 0) {
              return (
                <div key={index} className="font-medium">
                  <ShoppingBag className="w-3 h-3 inline mr-1" />
                  {line}
                </div>
              );
            }
            
            if (line.toLowerCase().includes('ブランド')) {
              return (
                <div key={index} className="text-primary">
                  {line}
                </div>
              );
            }
            
            return <div key={index} className="text-xs">{line}</div>;
          })}
        </div>
      );
    }
    
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
          
          {usingGPT && (
            <Badge 
              className="absolute top-2 left-2" 
              variant="outline"
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              GPT-4o
            </Badge>
          )}
        </div>
        
        <CardContent className="p-3">
          {item.classification ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{item.classification}</span>
                {item.confidence && !usingGPT && (
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
    </TooltipProvider>
  );
};

const Results: React.FC<ResultsProps> = ({ 
  items, 
  onReset, 
  showApiError,
  usingGoogleVision = false,
  usingGPT = false
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

      {showApiError && !usingGoogleVision && !usingGPT && (
        <Alert className="mb-6" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            アイテムの分類精度を向上させるには、GPT-4oなどの外部AIサービスの利用をお勧めします。
            ブラウザ内のAIには限界があります。
          </AlertDescription>
        </Alert>
      )}

      {usingGoogleVision && (
        <Alert className="mb-6">
          <Cloud className="h-4 w-4" />
          <AlertDescription>
            Google Cloud Vision APIを使用して高精度な分類を行っています。
          </AlertDescription>
        </Alert>
      )}
      
      {usingGPT && (
        <Alert className="mb-6" className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <AlertDescription>
            GPT-4oを使用して高度な商品分析を行っています。ブランド推定や素材判定が可能です。
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <ItemCard 
            key={`${item.type}-${index}`} 
            item={item} 
            usingGoogleVision={usingGoogleVision}
            usingGPT={usingGPT}
          />
        ))}
      </div>
    </div>
  );
};

export default Results;
