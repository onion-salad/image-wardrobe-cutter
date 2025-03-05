
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { DetectedItem, downloadImage } from '@/utils/imageProcessing';
import { Badge } from '@/components/ui/badge';

interface ResultsProps {
  items: DetectedItem[];
  onReset: () => void;
}

const ItemCard: React.FC<{ item: DetectedItem }> = ({ item }) => {
  const typeLabels = {
    top: 'Top',
    bottom: 'Bottom',
    shoes: 'Shoes',
    bag: 'Bag'
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
      <CardFooter className="p-2 bg-card flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full focus-ring"
          onClick={handleDownload}
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
};

const Results: React.FC<ResultsProps> = ({ items, onReset }) => {
  if (items.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium">Detected Items</h2>
        <Button variant="outline" onClick={onReset}>
          Process New Image
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <ItemCard key={`${item.type}-${index}`} item={item} />
        ))}
      </div>
    </div>
  );
};

export default Results;
