import React, { useState } from 'react';
import { POSES } from '../constants';
import { Pose, Category } from '../types';
import { Card, Badge } from './ui';
import { Search, Filter } from 'lucide-react';

export const PoseLibrary: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<Category | 'Todos'>('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPoses = POSES.filter(pose => {
    const matchesCategory = filterCategory === 'Todos' || pose.category === filterCategory;
    const matchesSearch = pose.portugueseName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          pose.sanskritName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories: Category[] = ['Aquecimento', 'Pé', 'Core', 'Sentado', 'Inversão', 'Restaurativa', 'Finalização'];

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-light text-sage-800 mb-2">Biblioteca de Asanas</h2>
        <p className="text-stone-500">Explore nossa coleção de {POSES.length} posturas.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 sticky top-0 bg-zen-offwhite/95 backdrop-blur-md z-10 py-4 -mx-4 px-4 border-b border-stone-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome (Português ou Sânscrito)..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <button 
            onClick={() => setFilterCategory('Todos')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${filterCategory === 'Todos' ? 'bg-sage-600 text-white' : 'bg-white border border-stone-200 text-stone-600'}`}
          >
            Todos
          </button>
          {categories.map(cat => (
             <button 
             key={cat}
             onClick={() => setFilterCategory(cat)}
             className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${filterCategory === cat ? 'bg-sage-600 text-white' : 'bg-white border border-stone-200 text-stone-600'}`}
           >
             {cat}
           </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPoses.map(pose => (
          <Card key={pose.id} className="hover:shadow-md transition-shadow">
            <div className="relative h-48 bg-stone-100">
               <img src={pose.media.thumbnailUrl} alt={pose.portugueseName} className="w-full h-full object-cover" loading="lazy" />
               <div className="absolute top-2 right-2">
                 <Badge color={pose.difficulty === 'Iniciante' ? 'green' : pose.difficulty === 'Intermediário' ? 'blue' : 'orange'}>
                   {pose.difficulty}
                 </Badge>
               </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg text-sage-900">{pose.portugueseName}</h3>
              <p className="text-xs text-sage-600 font-medium italic mb-2">{pose.sanskritName}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                 {pose.benefits.slice(0, 3).map(b => (
                   <span key={b} className="text-[10px] px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded">{b}</span>
                 ))}
              </div>
              <p className="text-sm text-stone-500 line-clamp-2">{pose.description}</p>
            </div>
          </Card>
        ))}
      </div>
      
      {filteredPoses.length === 0 && (
        <div className="text-center py-20 text-stone-400">
          <p>Nenhuma postura encontrada para estes filtros.</p>
        </div>
      )}
    </div>
  );
};
