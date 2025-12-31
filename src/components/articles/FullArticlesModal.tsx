import { useState, useEffect } from 'react';
import { X, Search, Heart, MessageCircle, Bookmark, ChevronDown, ChevronUp, Play, Loader2 } from 'lucide-react';
import { Article } from '@/types';
import { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CategoryList } from '@/components/categories/CategoryList';
import { ArticleDetailModal } from '@/components/articles/ArticleDetailModal';
import { cn } from '@/lib/utils';
import { mockCategories } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';

interface FullArticlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialArticles: Article[];
  initialCategory?: Category | null;
}

export function FullArticlesModal({ 
  isOpen, 
  onClose, 
  initialArticles,
  initialCategory 
}: FullArticlesModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(initialCategory || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    if (isOpen) {
      setArticles(initialArticles);
      setSelectedCategory(initialCategory || null);
      setSearchQuery('');
      setExpandedId(null);
    }
  }, [isOpen, initialArticles, initialCategory]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-articles', {
        body: { query: searchQuery.trim(), limit: 50 },
      });
      
      if (!error && data?.articles) {
        const mapped: Article[] = data.articles.map((a: any) => ({
          id: a.id,
          author_id: a.author_id || '',
          author: a.author ? {
            id: a.author.id,
            telegram_id: 0,
            username: a.author.username || '',
            first_name: a.author.first_name || '',
            last_name: a.author.last_name || undefined,
            avatar_url: a.author.avatar_url || undefined,
            reputation: a.author.reputation || 0,
            articles_count: 0,
            is_premium: a.author.is_premium || false,
            created_at: a.author.created_at || '',
          } : undefined,
          category_id: a.category_id || '',
          topic_id: '',
          title: a.title,
          preview: a.preview || '',
          body: a.body,
          media_url: a.media_url || undefined,
          media_type: a.media_type as 'image' | 'youtube' | undefined,
          is_anonymous: a.is_anonymous || false,
          status: (a.status || 'approved') as 'draft' | 'pending' | 'approved' | 'rejected',
          likes_count: a.likes_count || 0,
          comments_count: a.comments_count || 0,
          favorites_count: a.favorites_count || 0,
          rep_score: a.rep_score || 0,
          allow_comments: a.allow_comments !== false,
          created_at: a.created_at || '',
          updated_at: a.updated_at || '',
        }));
        setArticles(mapped);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (cat: Category | null) => {
    setSelectedCategory(cat);
    setSearchQuery('');
    // Reset to initial articles filtered by category
    if (cat) {
      setArticles(initialArticles.filter(a => a.category_id === cat.id));
    } else {
      setArticles(initialArticles);
    }
  };

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const displayedArticles = selectedCategory && !searchQuery
    ? articles.filter(a => a.category_id === selectedCategory.id)
    : articles;

  return (
    <>
      <div className="fixed inset-0 z-[100]">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-background/95 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />

        {/* Modal - Full screen */}
        <div className="absolute inset-0 flex flex-col animate-fade-in">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="font-heading text-xl font-semibold">Все статьи</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="px-4 pb-3">
              <div className="relative">
                <button
                  onClick={handleSearch}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск статей..."
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                />
              </div>
            </div>

            {/* Categories */}
            <CategoryList
              categories={mockCategories}
              selectedId={selectedCategory?.id}
              onSelect={handleCategoryChange}
              className="pb-3"
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {displayedArticles.length > 0 ? (
                  displayedArticles.map((article, index) => (
                    <div
                      key={article.id}
                      className={cn(
                        'rounded-2xl bg-card overflow-hidden transition-all duration-300 animate-slide-up',
                        expandedId === article.id ? 'ring-1 ring-primary/30' : ''
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Collapsed View */}
                      <button
                        onClick={() => toggleExpand(article.id)}
                        className="w-full p-4 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={article.is_anonymous ? '/placeholder.svg' : article.author?.avatar_url || '/placeholder.svg'}
                            alt={article.is_anonymous ? 'Аноним' : article.author?.first_name || 'Author'}
                            className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-foreground truncate">
                              {article.title}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{article.is_anonymous ? 'Аноним' : article.author?.first_name}</span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {article.likes_count}
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                {article.comments_count}
                              </div>
                            </div>
                          </div>
                          {expandedId === article.id ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                      </button>

                      {/* Expanded View */}
                      <div
                        className={cn(
                          'overflow-hidden transition-all duration-300',
                          expandedId === article.id ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                        )}
                      >
                        <div className="px-4 pb-4">
                          {/* Media */}
                          {article.media_url && (
                            <div className="mb-4 rounded-xl overflow-hidden">
                              {article.media_type === 'youtube' ? (
                                <div className="relative aspect-video bg-muted">
                                  <img
                                    src={`https://img.youtube.com/vi/${article.media_url}/maxresdefault.jpg`}
                                    alt={article.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90">
                                      <Play className="h-6 w-6 text-foreground ml-1" />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <img
                                  src={article.media_url}
                                  alt={article.title}
                                  className="w-full h-auto"
                                />
                              )}
                            </div>
                          )}

                          {/* Description */}
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-4">
                            {article.preview}
                          </p>

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Heart className="h-5 w-5" />
                                <span className="text-sm">{article.likes_count}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <MessageCircle className="h-5 w-5" />
                                <span className="text-sm">{article.comments_count}</span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedArticle(article)}
                            >
                              Открыть
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-12 text-center text-muted-foreground">
                    Нет статей
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ArticleDetailModal
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        article={selectedArticle}
      />
    </>
  );
}