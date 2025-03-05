
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Tag, AlertTriangle, Cloud, Info, ShoppingBag, Sparkles, Search, X } from 'lucide-react';
import { DetectedItem, downloadImage } from '@/utils/imageProcessing';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';

interface ResultsProps {
  items: DetectedItem[];
  onReset: () => void;
  showApiError?: boolean;
  usingGoogleVision?: boolean;
  usingGPT?: boolean;
}

// 類似商品検索ダイアログコンポーネント
const SimilarItemsDialog = ({ 
  open, 
  onClose, 
  itemType, 
  itemName 
}: { 
  open: boolean; 
  onClose: () => void; 
  itemType: string;
  itemName: string;
}) => {
  // Pinterestのような検索結果をシミュレート
  const mockSimilarItems = [
    {
      id: 1,
      name: `${itemName} - スタイル1`,
      image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=200',
      price: '¥12,800'
    },
    {
      id: 2,
      name: `${itemName} - スタイル2`,
      image: 'https://images.unsplash.com/photo-1548126032-079a0fb0099d?q=80&w=200',
      price: '¥9,800'
    },
    {
      id: 3,
      name: `${itemName} - スタイル3`,
      image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=200',
      price: '¥15,400'
    },
    {
      id: 4,
      name: `${itemName} - スタイル4`,
      image: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?q=80&w=200',
      price: '¥11,200'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            「{itemName}」の類似商品
          </DialogTitle>
          <DialogDescription>
            AIによって抽出された特徴に基づいて類似する商品を表示しています
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          {mockSimilarItems.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-md border hover-scale">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full aspect-square object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white">
                <div className="text-xs font-medium truncate">{item.name}</div>
                <div className="text-xs opacity-90">{item.price}</div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="secondary" className="text-xs">
                  詳細を見る
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end gap-2 mt-2">
          <DialogClose asChild>
            <Button variant="outline">
              閉じる
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ItemCard: React.FC<{ item: DetectedItem; usingGoogleVision?: boolean; usingGPT?: boolean }> = ({ 
  item, 
  usingGoogleVision,
  usingGPT
}) => {
  const [showSimilarItems, setShowSimilarItems] = useState(false);
  
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

  // 商品名を取得（GPTの結果から最初の行、または分類結果を使用）
  const getItemName = (): string => {
    if (item.productInfo && usingGPT) {
      const firstLine = item.productInfo.split('\n')[0];
      return firstLine || item.classification || typeLabels[item.type];
    }
    return item.classification || typeLabels[item.type];
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
              style={{background: 'linear-gradient(to right, rgb(168, 85, 247), rgb(59, 130, 246))', color: 'white', borderWidth: '0'}}
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
        
        <CardFooter className="p-2 bg-card flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 focus-ring"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            保存
          </Button>
          
          <Button
            variant="default"
            size="sm"
            className="flex-1 focus-ring bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
            onClick={() => setShowSimilarItems(true)}
          >
            <Search className="w-4 h-4 mr-2" />
            類似検索
          </Button>
          
          {showSimilarItems && (
            <SimilarItemsDialog
              open={showSimilarItems}
              onClose={() => setShowSimilarItems(false)}
              itemType={item.type}
              itemName={getItemName()}
            />
          )}
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
        <Alert 
          className="mb-6"
          style={{
            background: 'linear-gradient(to right, rgba(168, 85, 247, 0.1), rgba(59, 130, 246, 0.1))',
            borderColor: 'rgba(59, 130, 246, 0.2)'
          }}
        >
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
