
import React, { useState } from 'react';
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import Results from '@/components/Results';
import { DetectedItem, processImage } from '@/utils/imageProcessing';
import { toast } from '@/components/ui/use-toast';
import { useEffect } from 'react';

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleImageSelected = async (file: File) => {
    try {
      setIsProcessing(true);
      setShowResults(false);
      
      // Process the image
      const results = await processImage(file);
      
      // Set the results
      setDetectedItems(results);
      setShowResults(true);
      
      toast({
        title: "処理完了",
        description: "画像の処理が正常に完了しました",
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "処理失敗",
        description: "画像の処理中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setDetectedItems([]);
    setShowResults(false);
  };

  useEffect(() => {
    // Display initial toast with information
    const timer = setTimeout(() => {
      toast({
        title: "AIパワード画像認識",
        description: "画像をアップロードして、衣類アイテムやアクセサリーを自動的に抽出します。",
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      <div className="flex-1 container max-w-5xl mx-auto px-4 py-8">
        <Header />
        
        <div className="mt-8 space-y-12">
          {!showResults && (
            <ImageUploader 
              onImageSelected={handleImageSelected} 
              isLoading={isProcessing} 
            />
          )}
          
          {showResults && (
            <Results 
              items={detectedItems} 
              onReset={handleReset} 
            />
          )}
        </div>
      </div>
      
      <footer className="py-6 border-t">
        <div className="container text-center text-sm text-muted-foreground">
          <p>AIパワードの服装アイテム検出。サーバーへのアップロードは不要です。</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
