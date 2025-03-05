
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { loadAmazonCredentials, setAmazonCredentials } from '@/lib/amazonApi';

interface AmazonApiSetupProps {
  onSetupComplete: () => void;
}

const AmazonApiSetup: React.FC<AmazonApiSetupProps> = ({ onSetupComplete }) => {
  const { toast } = useToast();
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [partnerTag, setPartnerTag] = useState('');
  const [region, setRegion] = useState('jp');
  const [hasCredentials, setHasCredentials] = useState(false);

  useEffect(() => {
    // 保存済みの認証情報を確認
    const savedCredentials = loadAmazonCredentials();
    if (savedCredentials) {
      setAccessKey(savedCredentials.accessKey);
      setPartnerTag(savedCredentials.partnerTag);
      setRegion(savedCredentials.region);
      setHasCredentials(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessKey || !secretKey || !partnerTag) {
      toast({
        title: "入力エラー",
        description: "すべての必須項目を入力してください",
        variant: "destructive"
      });
      return;
    }
    
    // 認証情報を保存
    const saved = setAmazonCredentials({
      accessKey,
      secretKey,
      partnerTag,
      region
    });
    
    if (saved) {
      toast({
        title: "設定完了",
        description: "Amazon API認証情報を保存しました"
      });
      setHasCredentials(true);
      onSetupComplete();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Amazon商品検索API設定</CardTitle>
        <CardDescription>
          商品名と詳細情報を取得するには、AmazonのProduct Advertising APIの認証情報を入力してください。
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Amazon Product Advertising APIを利用するには、Amazonアソシエイトプログラムへの参加とAPI利用登録が必要です。
          </AlertDescription>
        </Alert>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessKey">アクセスキー</Label>
            <Input 
              id="accessKey" 
              value={accessKey} 
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="AKIAIOSFODNN7EXAMPLE"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="secretKey">シークレットキー</Label>
            <Input 
              id="secretKey" 
              type="password"
              value={secretKey} 
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="partnerTag">アソシエイトタグ</Label>
            <Input 
              id="partnerTag" 
              value={partnerTag} 
              onChange={(e) => setPartnerTag(e.target.value)}
              placeholder="example-22"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="region">リージョン</Label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="jp">日本 (jp)</option>
              <option value="com">アメリカ (com)</option>
              <option value="co.uk">イギリス (co.uk)</option>
              <option value="de">ドイツ (de)</option>
              <option value="fr">フランス (fr)</option>
            </select>
          </div>
          
          <Button type="submit" className="w-full">
            保存して続ける
          </Button>
        </form>
      </CardContent>
      
      {hasCredentials && (
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onSetupComplete}
          >
            設定済みの認証情報を使用する
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default AmazonApiSetup;
