
import React, { useState } from 'react';
import { Article } from '../types';
import { knowledgeBase } from '../services/knowledgeBase';
import { Badge, Button, Card } from './ui';
import { ArrowLeft, Clock, BookOpen, Share2, Sparkles, User, Tag, Settings, Plus, X, Image as ImageIcon } from 'lucide-react';

export const LearningHub: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [filter, setFilter] = useState<string>('Todos');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // New Article Form State
  const [newArticleData, setNewArticleData] = useState<Partial<Article>>({
      category: 'Inspiração',
      readTime: '3 min',
      author: 'Equipe YogaFlow',
      content: []
  });
  const [contentInput, setContentInput] = useState('');

  // Always fetch fresh data on render in case of updates
  const dailyArticle = knowledgeBase.getDailyArticle();
  const allArticles = knowledgeBase.getAllArticles();

  const categories = ['Todos', 'Filosofia', 'Benefícios', 'Inspiração', 'Anatomia'];
  const articleCategories = ['Filosofia', 'Benefícios', 'Inspiração', 'Anatomia'];

  const filteredArticles = filter === 'Todos' 
    ? allArticles.filter(a => a.id !== dailyArticle.id) // Don't repeat daily article in list
    : allArticles.filter(a => a.category === filter);

  const handleAddArticle = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newArticleData.title || !newArticleData.excerpt || !contentInput || !newArticleData.imageUrl) {
          alert("Por favor preencha todos os campos.");
          return;
      }

      const paragraphs = contentInput.split('\n').filter(p => p.trim().length > 0);

      const articleToAdd: Article = {
          id: Date.now().toString(),
          title: newArticleData.title,
          excerpt: newArticleData.excerpt,
          imageUrl: newArticleData.imageUrl,
          category: newArticleData.category as any,
          author: newArticleData.author || 'Equipe YogaFlow',
          readTime: newArticleData.readTime || '3 min',
          content: paragraphs
      };

      knowledgeBase.addArticle(articleToAdd);
      setIsAddModalOpen(false);
      
      // Reset
      setNewArticleData({ category: 'Inspiração', readTime: '3 min', author: 'Equipe YogaFlow', content: [] });
      setContentInput('');
  };

  if (selectedArticle) {
    return (
      <div className="pb-24 pt-4 px-4 max-w-3xl mx-auto animate-fade-in bg-white min-h-screen">
        <div className="sticky top-0 bg-white/95 backdrop-blur z-10 py-4 border-b border-stone-100 mb-6 flex justify-between items-center">
          <Button variant="ghost" onClick={() => setSelectedArticle(null)} className="text-stone-600 pl-0 hover:bg-transparent">
            <ArrowLeft size={20} className="mr-2" /> Voltar
          </Button>
          <div className="flex gap-2">
            <button className="p-2 text-stone-400 hover:text-sage-600 rounded-full hover:bg-stone-50">
               <Share2 size={20} />
            </button>
          </div>
        </div>

        <article>
            <div className="mb-6">
               <Badge color={
                   selectedArticle.category === 'Filosofia' ? 'blue' : 
                   selectedArticle.category === 'Inspiração' ? 'orange' : 'green'
               }>
                   {selectedArticle.category}
               </Badge>
               <h1 className="text-3xl md:text-4xl font-serif text-sage-900 mt-4 mb-4 leading-tight">
                   {selectedArticle.title}
               </h1>
               <div className="flex items-center gap-4 text-sm text-stone-500 mb-6">
                   <span className="flex items-center gap-1"><User size={14}/> {selectedArticle.author}</span>
                   <span className="flex items-center gap-1"><Clock size={14}/> {selectedArticle.readTime} de leitura</span>
               </div>
            </div>

            <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8 shadow-md">
                <img src={selectedArticle.imageUrl} alt={selectedArticle.title} className="w-full h-full object-cover" />
            </div>

            <div className="prose prose-stone prose-lg max-w-none">
                {selectedArticle.content.map((paragraph, idx) => (
                    <p key={idx} className="mb-4 text-stone-700 leading-relaxed">
                        {paragraph}
                    </p>
                ))}
            </div>

            <div className="mt-12 p-6 bg-sage-50 rounded-2xl border border-sage-100 text-center">
                <Sparkles className="mx-auto text-sage-500 mb-2" size={24} />
                <h3 className="font-medium text-sage-900 mb-2">Gostou deste artigo?</h3>
                <p className="text-stone-600 text-sm mb-4">Aplique este conhecimento na sua próxima prática.</p>
                <Button onClick={() => setSelectedArticle(null)}>Explorar Mais</Button>
            </div>
        </article>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-8 px-4 max-w-5xl mx-auto animate-fade-in">
      <div className="flex justify-between items-start mb-8">
        <div>
           <h1 className="text-3xl font-light text-sage-900">Aprendizado Diário</h1>
           <p className="text-stone-500">Nutra sua mente com sabedoria do Yoga.</p>
        </div>
        <div className="flex gap-2">
            {isAdminMode && (
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-sage-600 text-white rounded-full hover:bg-sage-700 transition-colors shadow-md"
                >
                    <Plus size={18} /> Novo Artigo
                </button>
            )}
            <button 
                onClick={() => setIsAdminMode(!isAdminMode)}
                className={`p-2 rounded-full transition-colors ${isAdminMode ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-400 hover:text-sage-600'}`}
                title="Modo Admin"
            >
                <Settings size={20} />
            </button>
        </div>
      </div>

      {/* Featured Daily Article */}
      <section className="mb-10">
         <h2 className="text-xs font-bold text-sage-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles size={14} /> Destaque de Hoje
         </h2>
         <div 
            onClick={() => setSelectedArticle(dailyArticle)}
            className="group cursor-pointer relative rounded-3xl overflow-hidden bg-stone-900 aspect-[4/3] md:aspect-[21/9] shadow-xl"
         >
            <img 
                src={dailyArticle.imageUrl} 
                alt={dailyArticle.title} 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-opacity duration-500 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-10">
                <div className="mb-2">
                    <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium border border-white/30">
                        {dailyArticle.category}
                    </span>
                    <span className="ml-3 text-white/80 text-xs flex inline-flex items-center gap-1">
                        <Clock size={12}/> {dailyArticle.readTime}
                    </span>
                </div>
                <h3 className="text-2xl md:text-4xl font-serif text-white mb-2 leading-tight group-hover:translate-x-2 transition-transform">
                    {dailyArticle.title}
                </h3>
                <p className="text-stone-200 text-sm md:text-base line-clamp-2 max-w-2xl">
                    {dailyArticle.excerpt}
                </p>
            </div>
         </div>
      </section>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors border ${
                filter === cat 
                ? 'bg-sage-600 text-white border-sage-600' 
                : 'bg-white text-stone-600 border-stone-200 hover:border-sage-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Article Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map(article => (
            <Card 
                key={article.id} 
                onClick={() => setSelectedArticle(article)}
                className="cursor-pointer group hover:border-sage-300 transition-colors h-full flex flex-col"
            >
                <div className="h-48 overflow-hidden bg-stone-100 relative">
                    <img 
                        src={article.imageUrl} 
                        alt={article.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        loading="lazy"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-stone-600 uppercase tracking-wider">
                        {article.category}
                    </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-medium text-sage-900 mb-2 leading-snug group-hover:text-sage-700 transition-colors">
                        {article.title}
                    </h3>
                    <p className="text-sm text-stone-500 line-clamp-3 mb-4 flex-1">
                        {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-stone-400 mt-auto pt-4 border-t border-stone-50">
                        <span>{article.author}</span>
                        <span className="flex items-center gap-1"><Clock size={12}/> {article.readTime}</span>
                    </div>
                </div>
            </Card>
        ))}
      </div>
      
      {filteredArticles.length === 0 && (
          <div className="text-center py-20 text-stone-400">
             <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
             <p>Nenhum artigo encontrado nesta categoria.</p>
          </div>
      )}

      {/* ADD ARTICLE MODAL */}
      {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50 rounded-t-3xl">
                    <h3 className="text-xl font-light text-sage-900">Publicar Novo Artigo</h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 flex-1">
                    <form id="add-article-form" onSubmit={handleAddArticle} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Título do Artigo</label>
                            <input 
                                required
                                type="text" 
                                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300 text-lg font-medium"
                                placeholder="Um título inspirador..."
                                value={newArticleData.title || ''}
                                onChange={(e) => setNewArticleData({...newArticleData, title: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Categoria</label>
                                <select 
                                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300"
                                    value={newArticleData.category}
                                    onChange={(e) => setNewArticleData({...newArticleData, category: e.target.value as any})}
                                >
                                    {articleCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Tempo de Leitura</label>
                                <input 
                                    type="text" 
                                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300"
                                    placeholder="Ex: 5 min"
                                    value={newArticleData.readTime || ''}
                                    onChange={(e) => setNewArticleData({...newArticleData, readTime: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Imagem de Capa (URL)</label>
                            <div className="relative">
                                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                                <input 
                                    required
                                    type="text" 
                                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300"
                                    placeholder="https://..."
                                    value={newArticleData.imageUrl || ''}
                                    onChange={(e) => setNewArticleData({...newArticleData, imageUrl: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Resumo (Excerpt)</label>
                            <textarea 
                                required
                                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300 h-20"
                                placeholder="Uma breve introdução que aparecerá no card..."
                                value={newArticleData.excerpt || ''}
                                onChange={(e) => setNewArticleData({...newArticleData, excerpt: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Conteúdo (Parágrafos)</label>
                            <textarea 
                                required
                                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300 h-64"
                                placeholder="Escreva o conteúdo aqui. Pressione Enter duas vezes para criar um novo parágrafo."
                                value={contentInput}
                                onChange={(e) => setContentInput(e.target.value)}
                            />
                            <p className="text-xs text-stone-400 mt-2">Dica: Cada quebra de linha será tratada como um novo parágrafo.</p>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-stone-100 flex justify-end gap-3 rounded-b-3xl bg-white">
                    <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
                    <Button type="submit" form="add-article-form">Publicar Artigo</Button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};
