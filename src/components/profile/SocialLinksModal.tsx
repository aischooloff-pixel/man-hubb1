import { useState } from 'react';
import { X, Send, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SocialLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTelegram?: string;
  initialWebsite?: string;
  onSave?: (telegram: string, website: string) => void;
}

export function SocialLinksModal({ 
  isOpen, 
  onClose, 
  initialTelegram = '', 
  initialWebsite = '',
  onSave 
}: SocialLinksModalProps) {
  const [telegram, setTelegram] = useState(initialTelegram);
  const [website, setWebsite] = useState(initialWebsite);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave?.(telegram, website);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-card animate-slide-up',
          'md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg'
        )}
      >
        {/* Handle bar for mobile */}
        <div className="sticky top-0 z-10 flex justify-center bg-card pt-3 md:hidden">
          <div className="h-1 w-12 rounded-full bg-border" />
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="p-6">
          <h2 className="mb-6 font-heading text-xl font-semibold">Социальные сети</h2>

          <div className="space-y-6">
            {/* Telegram */}
            <div className="space-y-2">
              <Label htmlFor="telegram" className="flex items-center gap-2">
                <Send className="h-4 w-4 text-muted-foreground" />
                Telegram канал
              </Label>
              <Input
                id="telegram"
                type="text"
                placeholder="@yourchannel или t.me/yourchannel"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                className="bg-secondary/50"
              />
              <p className="text-xs text-muted-foreground">
                Укажите ссылку на ваш Telegram канал
              </p>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Веб-сайт
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="https://yoursite.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="bg-secondary/50"
              />
              <p className="text-xs text-muted-foreground">
                Укажите ссылку на ваш веб-сайт или блог
              </p>
            </div>
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            className="mt-6 w-full gap-2"
            disabled={saved}
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Сохранено
              </>
            ) : (
              'Сохранить'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}