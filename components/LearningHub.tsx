

import React, { useState, useEffect } from 'react';
import { Article, Comment } from '../types';
import { knowledgeBase } from '../services/knowledgeBase';
import { Badge, Button, Card } from './ui';
import { ArrowLeft, Clock, BookOpen, Share2, Sparkles, User, Tag, Settings, Plus, X, Image as ImageIcon, Heart, MessageCircle, Send, ThumbsUp, CornerDownRight, Users, Newspaper, Trash2 } from 'lucide-react';
import { authService } from '../services/auth';

export const LearningHub: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [filter, setFilter] = useState<string>('Todos');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // View Mode State (Similar to PoseLibrary)
  const [viewMode, setViewMode] = useState<'OFFICIAL' | 'COMMUNITY'>('OFFICIAL');
  
  // Current User
  const currentUser = authService.getCurrentUser();
  
  // New Article Form
  const [newArticleData, setNewArticleData] = useState<Partial<Article>>({
      category: 'Inspiração',
      readTime: '3 min',
      author: currentUser?.name || 'Membro da Comunidade',
      content: []
  });
  const [contentInput, setContentInput] = useState('');

  // Comment Form
  const [commentInput, setCommentInput] = useState('');
  
  // Reply State
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');

  // Load articles on mount
  useEffect(() => {
      refreshArticles();
  }, []);

  const refreshArticles = () => {
      setArticles(knowledgeBase.getAllArticles());
  };

  const dailyArticle = knowledgeBase.getDailyArticle();

  // Updated Filters - Removed 'Plataforma' and 'Comunidade' as they are now tabs
  const filterOptions = ['Todos', 'Filosofia', 'Benefícios', 'Inspiração', 'Anatomia'];
  const articleCategories = ['Filosofia', 'Benefícios', 'Inspiração', 'Anatomia'];

  // Enhanced Filtering Logic based on ViewMode
  const filteredArticles = articles.filter(a => {
      // 1. Filter by View Mode (Tab)
      if (viewMode === 'OFFICIAL' && a.isUserGenerated) return false;
      if (viewMode === 'COMMUNITY' && !a.isUserGenerated) return false;

      // 2. Filter by Category
      if (filter === 'Todos') return true;
      return a.category === filter;
  });

  const handleAddArticle = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newArticleData.title || !newArticleData.excerpt || !contentInput || !newArticleData.imageUrl) {
          alert("Por favor preencha todos os campos.");
          return;
      }

      const paragraphs = contentInput.split('\n').filter(p => p.trim().length > 0);

      const articleToAdd: Article = {
          id: Date.now().toString(),
          userId: currentUser?.id, // Store author ID
          title: newArticleData.title,
          excerpt: newArticleData.excerpt,
          imageUrl: newArticleData.imageUrl,
          category: newArticleData.category as any,
          author: newArticleData.author || currentUser?.name || 'Comunidade',
          readTime: newArticleData.readTime || '3 min',
          content: paragraphs,
          likes: 0,
          likedBy: [],
          comments: [],
          isUserGenerated: true
      };

      knowledgeBase.addArticle(articleToAdd);
      refreshArticles();
      setIsAddModalOpen(false);
      // Switch to community view to see the new post
      setViewMode('COMMUNITY');
      setNewArticleData({ category: 'Inspiração', readTime: '3 min', author: currentUser?.name || 'Comunidade', content: [] });
      setContentInput('');
  };
  
  const handleDeleteArticle = (e: React.MouseEvent, articleId: string) => {
      e.stopPropagation();
      if (window.confirm("Tem certeza que deseja apagar esta publicação?")) {
          knowledgeBase.deleteArticle(articleId);
          refreshArticles();
          if (selectedArticle?.id === articleId) {
              setSelectedArticle(null);
          }
      }
  };

  const handleLikeArticle = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (selectedArticle && currentUser) {
          const updated = knowledgeBase.toggleLike(selectedArticle.id, currentUser.id);
          if (updated) {
              setSelectedArticle(updated);
              refreshArticles();
          }
      }
  };

  const handlePostComment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!commentInput.trim() || !selectedArticle) return;
      
      const updated = knowledgeBase.addComment(selectedArticle.id, commentInput);
      if (updated) {
          setSelectedArticle(updated);
          refreshArticles();
          setCommentInput('');
      }
  };

  const handleLikeComment = (commentId: string) => {
      if (selectedArticle && currentUser) {
          const updated = knowledgeBase.toggleCommentLike(selectedArticle.id, commentId, currentUser.id);
          if (updated) {
              setSelectedArticle(updated);
              refreshArticles();
          }
      }
  };

  const handleReplyToComment = (parentCommentId: string) => {
      if (!replyInput.trim() || !selectedArticle) return;
      
      const updated = knowledgeBase.addReply(selectedArticle.id, parentCommentId, replyInput);
      if (updated) {
          setSelectedArticle(updated);
          refreshArticles();
          setReplyInput('');
          setReplyingTo(null);
      }
  };

  // Helper to render comments recursively
  const renderComment = (comment: Comment, isReply = false) => {
      const isLikedByMe = currentUser ? (comment.likedBy || []).includes(currentUser.id) : false;
      const isReplying = replyingTo === comment.id;

      return (
          <div key={comment.id} className={`group bg-white p-6 rounded-2xl border border-stone-100 hover:border-sage-200 transition-colors shadow-sm ${isReply ? 'ml-8 md:ml-12 border-l-4 border-l-sage-100' : ''}`}>
              <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 text-sm ${isReply ? 'bg-stone-50 text-stone-500' : 'bg-stone-100 text-stone-600'}`}>
                      {comment.userName.charAt(0)}
                  </div>
                  <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                              <span className="font-bold text-sage-900">{comment.userName}</span>
                              <span className="text-xs text-stone-400 hidden sm:inline">•</span>
                              <span className="text-xs text-stone-400">
                                  {new Date(comment.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                              </span>
                          </div>
                      </div>
                      <p className="text-stone-600 leading-relaxed whitespace-pre-line">
                          {comment.text}
                      </p>
                      
                      {/* Interaction Actions */}
                      <div className="mt-4 flex gap-4">
                          <button 
                            onClick={() => handleLikeComment(comment.id)}
                            className={`text-xs font-medium flex items-center gap-1 transition-colors ${isLikedByMe ? 'text-red-500' : 'text-stone-400 hover:text-sage-600'}`}
                          >
                              <ThumbsUp size={12} fill={isLikedByMe ? "currentColor" : "none"}/> 
                              {comment.likes > 0 ? comment.likes : 'Curtir'}
                          </button>
                          
                          <button 
                             onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                             className="text-xs font-medium text-stone-400 hover:text-sage-600 flex items-center gap-1 transition-colors"
                          >
                              <MessageCircle size={12} /> Responder
                          </button>
                      </div>

                      {/* Reply Input */}
                      {isReplying && (
                          <div className="mt-4 animate-fade-in pl-4 border-l-2 border-sage-100">
                             <div className="flex gap-2">
                                <input 
                                   type="text" 
                                   autoFocus
                                   value={replyInput}
                                   onChange={(e) => setReplyInput(e.target.value)}
                                   placeholder={`Respondendo a ${comment.userName}...`}
                                   className="flex-1 p-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-sage-300"
                                />
                                <Button size="sm" onClick={() => handleReplyToComment(comment.id)} disabled={!replyInput.trim()} className="h-full py-2 px-3">
                                   <Send size={14} />
                                </Button>
                             </div>
                          </div>
                      )}
                  </div>
              </div>

              {/* Render Replies */}
              {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 space-y-4 pt-2">
                      {comment.replies.map(reply => renderComment(reply, true))}
                  </div>
              )}
          </div>
      );
  };

  if (selectedArticle) {
    const isLikedByMe = currentUser ? (selectedArticle.likedBy || []).includes(currentUser.id) : false;

    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto animate-fade-in">
        {/* Navigation Bar */}
        <nav className="sticky top-0 bg-white/90 backdrop-blur-md z-20 border-b border-stone-100 px-4 h-16 flex items-center justify-between max-w-5xl mx-auto w-full">
          <Button variant="ghost" onClick={() => setSelectedArticle(null)} className="text-stone-600 hover:bg-stone-100 -ml-2 gap-2 pl-2 pr-4">
            <ArrowLeft size={20} /> <span className="font-medium">Voltar</span>
          </Button>
          <div className="flex gap-2">
            <button className="p-2 text-stone-400 hover:text-sage-600 rounded-full hover:bg-stone-50 transition-colors" title="Compartilhar">
               <Share2 size={20} />
            </button>
            <button className="p-2 text-stone-400 hover:text-sage-600 rounded-full hover:bg-stone-50 transition-colors" title="Salvar">
               <BookOpen size={20} />
            </button>
          </div>
        </nav>

        <article className="max-w-3xl mx-auto px-4 py-8">
            {/* Header */}
            <header className="mb-8 text-center md:text-left">
               <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6">
                  <Badge color={
                      selectedArticle.category === 'Filosofia' ? 'blue' : 
                      selectedArticle.category === 'Inspiração' ? 'orange' : 'green'
                  }>
                      {selectedArticle.category}
                  </Badge>
                  {selectedArticle.isUserGenerated && (
                      <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-md flex items-center gap-1">
                          <Users size={10} /> Comunidade
                      </span>
                  )}
                  <span className="text-xs text-stone-400 flex items-center gap-1 ml-2">
                      <Clock size={12}/> {selectedArticle.readTime} de leitura
                  </span>
               </div>
               
               <h1 className="text-3xl md:text-5xl font-serif text-sage-900 mb-6 leading-tight tracking-tight">
                   {selectedArticle.title}
               </h1>
               
               <div className="flex items-center justify-center md:justify-start gap-3">
                   <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 font-bold text-lg">
                       {selectedArticle.author.charAt(0)}
                   </div>
                   <div className="text-left">
                       <p className="text-sm font-bold text-stone-800">{selectedArticle.author}</p>
                       <p className="text-xs text-stone-500">Autor(a)</p>
                   </div>
               </div>
            </header>

            {/* Featured Image */}
            <div className="w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden mb-10 shadow-lg bg-stone-100">
                <img src={selectedArticle.imageUrl} alt={selectedArticle.title} className="w-full h-full object-cover" />
            </div>

            {/* Content */}
            <div className="prose prose-stone prose-lg md:prose-xl max-w-none mb-16 px-1">
                <p className="lead text-xl text-stone-600 italic font-serif border-l-4 border-sage-300 pl-4 mb-8">
                    {selectedArticle.excerpt}
                </p>
                {selectedArticle.content.map((paragraph, idx) => (
                    <p key={idx} className="mb-6 text-stone-800 leading-relaxed font-light">
                        {paragraph}
                    </p>
                ))}
            </div>
        </article>
            
        {/* Social / Interactions Section */}
        <section className="bg-stone-50 border-t border-stone-200 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                
                {/* Actions Bar */}
                <div className="flex items-center justify-between mb-10 bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={(e) => handleLikeArticle(e)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium border ${
                                isLikedByMe
                                ? 'bg-red-50 text-red-600 border-red-100' 
                                : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
                            }`}
                        >
                            <Heart size={20} fill={isLikedByMe ? "currentColor" : "none"} className={isLikedByMe ? "animate-pulse" : ""} />
                            <span>{selectedArticle.likes}</span>
                            <span className="hidden sm:inline">Curtidas</span>
                        </button>
                    </div>
                    <div className="text-stone-400 text-sm font-medium">
                        {selectedArticle.comments?.length || 0} Comentários
                    </div>
                </div>

                <h3 className="text-2xl font-serif text-sage-900 mb-6">Discussão</h3>

                {/* Comment Input Area */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 mb-10">
                    <div className="flex gap-4">
                        <div className="hidden sm:flex w-10 h-10 rounded-full bg-sage-100 items-center justify-center text-sage-700 font-bold shrink-0">
                            {currentUser?.name.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                            <form onSubmit={handlePostComment}>
                                <textarea 
                                    value={commentInput}
                                    onChange={(e) => setCommentInput(e.target.value)}
                                    placeholder="Adicione um comentário construtivo..."
                                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300 focus:bg-white transition-all min-h-[100px] resize-y text-stone-700 placeholder-stone-400"
                                />
                                <div className="flex justify-between items-center mt-3">
                                    <p className="text-xs text-stone-400">Seja gentil e respeitoso.</p>
                                    <Button 
                                        type="submit" 
                                        disabled={!commentInput.trim()}
                                        className="bg-sage-600 hover:bg-sage-700 text-white px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Publicar
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Comments List */}
                <div className="space-y-6">
                    {selectedArticle.comments && selectedArticle.comments.length > 0 ? (
                        [...selectedArticle.comments].reverse().map(comment => renderComment(comment))
                    ) : (
                        <div className="text-center py-12 px-4 bg-white/50 rounded-3xl border border-dashed border-stone-200">
                            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
                                <MessageCircle size={24} />
                            </div>
                            <h4 className="text-stone-900 font-medium mb-1">Ainda não há comentários</h4>
                            <p className="text-stone-500 text-sm">Seja a primeira pessoa a compartilhar seus pensamentos sobre este tema.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-8 px-4 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
           <h1 className="text-3xl font-light text-sage-900">Aprendizado Diário</h1>
           <p className="text-stone-500">Nutra sua mente com sabedoria e troque experiências.</p>
      </div>

      {/* Main Tabs (Official vs Community) */}
      <div className="flex gap-4 border-b border-stone-200 mb-8">
        <button
          onClick={() => { setViewMode('OFFICIAL'); setFilter('Todos'); }}
          className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            viewMode === 'OFFICIAL' 
              ? 'border-sage-600 text-sage-800' 
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <Newspaper size={18} /> Artigos & Estudos
        </button>
        <button
          onClick={() => { setViewMode('COMMUNITY'); setFilter('Todos'); }}
          className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            viewMode === 'COMMUNITY' 
              ? 'border-sage-600 text-sage-800' 
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <Users size={18} /> Comunidade
        </button>
        
        <div className="flex-1"></div>

        {/* Action Button - Only visible in Community Mode */}
        {viewMode === 'COMMUNITY' && (
             <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-sage-600 text-white text-xs font-medium rounded-full hover:bg-sage-700 transition-colors shadow-sm self-center mb-2"
            >
                <Plus size={14} /> Publicar na Comunidade
            </button>
        )}
      </div>

      {/* Featured Daily Article - Only in Official View */}
      {viewMode === 'OFFICIAL' && (
          <section className="mb-10 animate-fade-in">
             <h2 className="text-xs font-bold text-sage-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles size={14} /> Destaque de Hoje
             </h2>
             <div 
                onClick={() => setSelectedArticle(dailyArticle)}
                className="group cursor-pointer relative rounded-3xl overflow-hidden bg-stone-900 aspect-[4/3] md:aspect-[21/9] shadow-xl"
                role="button"
                aria-label={`Ler artigo destaque: ${dailyArticle.title}`}
             >
                <img 
                    src={dailyArticle.imageUrl} 
                    alt="" 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-opacity duration-500 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-10">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium border border-white/30">
                            {dailyArticle.category}
                        </span>
                        <span className="text-white/80 text-xs flex inline-flex items-center gap-1">
                            <Clock size={12}/> {dailyArticle.readTime}
                        </span>
                        <span className="text-white/80 text-xs flex inline-flex items-center gap-1 ml-2">
                            <Heart size={12} fill="currentColor"/> {dailyArticle.likes}
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
      )}

      {/* Categories Filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-6" role="tablist">
        {filterOptions.map(opt => (
          <button
            key={opt}
            role="tab"
            aria-selected={filter === opt}
            onClick={() => setFilter(opt)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors border ${
                filter === opt 
                ? 'bg-sage-600 text-white border-sage-600' 
                : 'bg-white text-stone-600 border-stone-200 hover:border-sage-400'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Article Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {filteredArticles.map(article => {
            const isMyPost = currentUser && article.userId === currentUser.id;
            
            return (
                <div 
                    key={article.id} 
                    onClick={() => setSelectedArticle(article)}
                    className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden cursor-pointer group hover:border-sage-300 transition-colors h-full flex flex-col relative"
                >
                    <div className="h-48 overflow-hidden bg-stone-100 relative">
                        <img 
                            src={article.imageUrl} 
                            alt="" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                            loading="lazy"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                            {article.isUserGenerated && (
                                <div className="bg-purple-600/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                                    Comunidade
                                </div>
                            )}
                            <div className="bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-stone-600 uppercase tracking-wider shadow-sm">
                                {article.category}
                            </div>
                        </div>
                        
                        {/* Delete Button for Owner */}
                        {isMyPost && (
                            <button
                                onClick={(e) => handleDeleteArticle(e, article.id)}
                                className="absolute top-2 left-2 bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-full shadow-sm backdrop-blur transition-all"
                                title="Excluir Publicação"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                        <h3 className="text-lg font-medium text-sage-900 mb-2 leading-snug group-hover:text-sage-700 transition-colors">
                            {article.title}
                        </h3>
                        <p className="text-sm text-stone-500 line-clamp-2 mb-4 flex-1">
                            {article.excerpt}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-stone-400 mt-auto pt-4 border-t border-stone-50">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1"><Heart size={12}/> {article.likes}</span>
                                <span className="flex items-center gap-1"><MessageCircle size={12}/> {article.comments?.length || 0}</span>
                            </div>
                            <span className="flex items-center gap-1"><User size={12}/> {article.author.split(' ')[0]}</span>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
      
      {filteredArticles.length === 0 && (
          <div className="text-center py-20 text-stone-400">
             {viewMode === 'COMMUNITY' ? (
                 <>
                    <Users size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Ainda não há publicações da comunidade nesta categoria.</p>
                    <button onClick={() => setIsAddModalOpen(true)} className="text-sage-600 font-medium mt-2 hover:underline">
                        Seja a primeira pessoa a postar!
                    </button>
                 </>
             ) : (
                 <>
                    <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Nenhum artigo oficial encontrado nesta categoria.</p>
                 </>
             )}
          </div>
      )}

      {/* ADD ARTICLE MODAL */}
      {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50 rounded-t-3xl">
                    <h3 className="text-xl font-light text-sage-900">Publicar na Comunidade</h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 flex-1">
                    <form id="add-article-form" onSubmit={handleAddArticle} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Título do Post</label>
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
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Autor (Você)</label>
                                <input 
                                    type="text" 
                                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300 bg-stone-100 text-stone-500 cursor-not-allowed"
                                    value={newArticleData.author || ''}
                                    readOnly
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
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Resumo (Para o Card)</label>
                            <textarea 
                                required
                                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300 h-20"
                                placeholder="Uma breve introdução que aparecerá na lista..."
                                value={newArticleData.excerpt || ''}
                                onChange={(e) => setNewArticleData({...newArticleData, excerpt: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Conteúdo</label>
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
                    <Button type="submit" form="add-article-form">Publicar Post</Button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};