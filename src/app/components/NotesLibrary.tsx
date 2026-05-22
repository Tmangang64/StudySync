import { useState } from 'react';
import { Card } from './ui/card';
import { FileText, Search, Trash2, ArrowRight, Share2, Sparkles, Folder, Check, X } from 'lucide-react';
import { useAppContext, SavedNote } from '../context/AppContext';
import { toast } from 'sonner';

export function NotesLibrary({ 
  onOpenNote, 
  onGenerateMaterials 
}: { 
  onOpenNote: (note: SavedNote) => void,
  onGenerateMaterials: (note: SavedNote) => void
}) {
  const { notes, deleteNote, updateNote, user } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  
  const visibleNotes = notes.filter(n => !n.isDeleted);
  
  const filteredNotes = visibleNotes.filter(n => {
    if (filterCategory !== 'All' && n.category !== filterCategory) return false;
    if (searchTerm && !n.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !n.course.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const categories = ['All', 'Course', 'Unit / Chapter', 'Exam / Quiz', 'Weekly Notes', 'Group Project', 'Other'];

  const handleDelete = (id: string) => {
    deleteNote(id, true); // soft delete
    toast.success("Note moved to trash");
  };

  const handleShare = (note: SavedNote) => {
    updateNote(note.id, { visibility: note.visibility === 'private' ? 'shared' : 'private' });
    toast.success(`Note is now ${note.visibility === 'private' ? 'shared' : 'private'}`);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search notes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
        <select 
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700"
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Folder size={48} className="mx-auto mb-3 opacity-20" />
            <p>No notes found in your library.</p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <Card key={note.id} className="p-4 hover:border-blue-300 transition-colors group relative overflow-hidden flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mt-0.5">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{note.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">{note.course} • {note.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleShare(note)} className={`p-1.5 rounded-md hover:bg-slate-100 ${note.visibility === 'shared' ? 'text-green-600' : 'text-slate-400'}`} title="Toggle sharing">
                    <Share2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(note.id)} className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500" title="Delete note">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4 mt-1">
                {note.tags.map(tag => (
                  <span key={tag} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span title="Generated Flashcards">{note.generatedFlashcards?.length || 0} Cards</span>
                  <span title="Generated Quizzes">{note.generatedQuizQuestions?.length || 0} Quizzes</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onGenerateMaterials(note)} 
                    className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <Sparkles size={14} />
                    Generate
                  </button>
                  <button 
                    onClick={() => onOpenNote(note)} 
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Open
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
