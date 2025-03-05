
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Tag, AlertTriangle } from 'lucide-react';
import { DetectedItem, downloadImage } from '@/utils/imageProcessing';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ResultsProps {
  items: DetectedItem[];
  onReset: () => void;
  showApiError?: boolean;
}

const ItemCard: React.FC<{ item: DetectedItem }> = ({ item }) => {
  const typeLabels = {
    top: 'トップス',
    bottom: 'ボトムス',
    shoes: '靴',
    bag: 'バッグ'
  };

  const handleDownload = () => {
    downloadImage(item.blob, `${item.type}.png`);
  };

  return (
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
      </div>
      
      {/* 分類結果の表示 */}
      <CardContent className="p-3">
        {item.classification ? (
          <div className="flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{item.classification}</span>
            {item.confidence && (
              <span className="text-xs text-muted-foreground ml-auto">
                {Math.round(item.confidence * 100)}%
              </span>
            )}
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
  );
};

const Results: React.FC<ResultsProps> = ({ items, onReset, showApiError }) => {
  if (items.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium">検出アイテム</h2>
        <Button variant="outline" onClick={onReset}>
          新しい画像を処理
        </Button>
      </div>

      {showApiError && (
        <Alert className="mb-6" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            アイテムの分類精度を向上させるには、Google Cloud Vision APIなどの外部サービスの利用をお勧めします。
            ブラウザ内のAIには限界があります。
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <ItemCard key={`${item.type}-${index}`} item={item} />
        ))}
      </div>
    </div>
  );
};

export default Results;
