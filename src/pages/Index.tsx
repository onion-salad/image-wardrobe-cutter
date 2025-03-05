
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import Results from '@/components/Results';
import { DetectedItem, processImage } from '@/utils/imageProcessing';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [usingGPT, setUsingGPT] = useState(true); // GPT-4を使用
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleImageSelected = async (file: File) => {
    try {
      // OpenAI APIキーの確認
      if (usingGPT && !localStorage.getItem('openai_api_key')) {
        toast({
          title: "APIキーが必要です",
          description: "OpenAI APIキーを設定してください",
          variant: "destructive"
        });
        setSheetOpen(true);
        return;
      }
      
      setIsProcessing(true);
      setShowResults(false);
      setApiError(false);
      
      // 画像処理
      const results = await processImage(file);
      
      // 分類が不明のアイテムをチェック
      const hasUnknownItems = results.some(item => !item.classification || item.classification === '不明');
      
      // 結果を設定
      setDetectedItems(results);
      setShowResults(true);
      
      if (hasUnknownItems) {
        setApiError(true);
        toast({
          title: "一部の分類が不明です",
          description: "より正確な分類のために追加のデータが必要かもしれません",
          variant: "destructive"
        });
      } else {
        toast({
          title: "処理完了",
          description: `${usingGPT ? 'GPT-4o' : 'AI'}で画像の処理が正常に完了しました`,
        });
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setApiError(true);
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
    setApiError(false);
  };
  
  const saveApiKey = () => {
    if (openaiApiKey) {
      localStorage.setItem('openai_api_key', openaiApiKey);
      toast({
        title: "APIキーを保存しました",
        description: "OpenAI APIキーがローカルに保存されました",
      });
      setSheetOpen(false);
    } else {
      toast({
        title: "APIキーが空です",
        description: "有効なAPIキーを入力してください",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    // 保存されたAPIキーを読み込み
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setOpenaiApiKey(savedApiKey);
    } else if (usingGPT) {
      // 保存されたAPIキーがない場合は設定を促す
      setTimeout(() => {
        setSheetOpen(true);
      }, 1000);
    }
    
    // 初期トースト表示
    const timer = setTimeout(() => {
      toast({
        title: "AIパワード画像認識",
        description: "GPT-4oを使用して衣類アイテムやアクセサリーを自動的に抽出します。",
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      <div className="flex-1 container max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
          <Header />
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>API設定</SheetTitle>
                <SheetDescription>
                  画像認識機能を使用するにはOpenAI APIキーが必要です。
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">OpenAI APIキー</CardTitle>
                    <CardDescription>
                      GPT-4oモデルを使用するためのAPIキー
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="sk-..."
                        value={openaiApiKey}
                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        APIキーはブラウザのローカルストレージに保存されます
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <SheetFooter>
                <Button onClick={saveApiKey}>保存</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
        
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
              showApiError={apiError}
              usingGPT={usingGPT}
            />
          )}
        </div>
      </div>
      
      <footer className="py-6 border-t">
        <div className="container text-center text-sm text-muted-foreground">
          <p>AIパワードの服装アイテム検出。サーバーへのアップロードは不要です。</p>
          <p className="mt-2 text-xs">
            GPT-4oを利用して高精度なアイテム分析を実現しています。
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
