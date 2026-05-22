import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import * as mammoth from 'mammoth';
import { toast } from 'sonner';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, BookOpen, Brain, FileText, Sparkles, Lock, Plus, Trash2, ChevronLeft, ChevronRight, CheckCircle, XCircle, Upload, X, Folder } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from './ui/sheet';
import { useAppContext, SavedNote } from '../context/AppContext';
import { NotesLibrary } from './NotesLibrary';

import confetti from "canvas-confetti";

export function StudyTools() {
  const navigate = useNavigate();
  const { sessions, updateSessionStatus } = useAppContext();
  
  const currentSession = sessions.find(s => s.status === 'active' || s.status === 'pending' || s.status === 'ready');

  const [activeTool, setActiveTool] = useState<string | null>(null);

  // --- Flashcards State ---
  const [flashcards, setFlashcards] = useState<{ id: string; front: string; back: string }[]>([
    { id: '1', front: 'What is the powerhouse of the cell?', back: 'Mitochondria' },
    { id: '2', front: 'What does DNA stand for?', back: 'Deoxyribonucleic Acid' }
  ]);
  const [flashcardMode, setFlashcardMode] = useState<'list' | 'study'>('list');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  // --- Quiz State ---
  const [quizQuestions, setQuizQuestions] = useState<{ id: string; q: string; options: string[]; a: number }[]>([
    { id: '1', q: 'What is 2 + 2?', options: ['3', '4', '5', '6'], a: 1 },
    { id: '2', q: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'], a: 2 }
  ]);
  const [quizMode, setQuizMode] = useState<'list' | 'take' | 'results'>('list');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [newQ, setNewQ] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [newA, setNewA] = useState(0);

  // --- Notes State ---
  const [studyGuide, setStudyGuide] = useState('');
  const [reflection, setReflection] = useState('');

  // --- Reference Notes State ---
  const [referenceNotes, setReferenceNotes] = useState('');
  const [referenceFileName, setReferenceFileName] = useState('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [libraryMode, setLibraryMode] = useState<boolean>(true);
  const [pendingUpload, setPendingUpload] = useState<{name: string, content: string} | null>(null);
  const [uploadForm, setUploadForm] = useState<{title: string, category: string, tags: string, visibility: 'private'|'shared'}>({
    title: '', category: 'Course', tags: '', visibility: 'private'
  });
  
  const { addNote, updateNote } = useAppContext();

  const syncToolState = (updates: any) => {
    if (currentSession && (currentSession.type === 'buddy' || currentSession.type === 'group')) {
      updateSessionStatus(currentSession.id, currentSession.status, {
        toolState: { ...(currentSession.toolState || {}), ...updates }
      });
    }
  };

  useEffect(() => {
    if (currentSession?.toolState) {
      const ts = currentSession.toolState;
      if (ts.activeTool !== undefined && ts.activeTool !== activeTool) setActiveTool(ts.activeTool);
      if (ts.flashcardMode !== undefined && ts.flashcardMode !== flashcardMode) setFlashcardMode(ts.flashcardMode);
      if (ts.currentCardIndex !== undefined && ts.currentCardIndex !== currentCardIndex) setCurrentCardIndex(ts.currentCardIndex);
      if (ts.isFlipped !== undefined && ts.isFlipped !== isFlipped) setIsFlipped(ts.isFlipped);
      if (ts.quizMode !== undefined && ts.quizMode !== quizMode) setQuizMode(ts.quizMode);
      if (ts.currentQuizIndex !== undefined && ts.currentQuizIndex !== currentQuizIndex) setCurrentQuizIndex(ts.currentQuizIndex);
      if (ts.score !== undefined && ts.score !== score) setScore(ts.score);
      if (ts.selectedOption !== undefined && ts.selectedOption !== selectedOption) setSelectedOption(ts.selectedOption);
      if (ts.studyGuide !== undefined && ts.studyGuide !== studyGuide) setStudyGuide(ts.studyGuide);
      if (ts.reflection !== undefined && ts.reflection !== reflection) setReflection(ts.reflection);
      if (ts.referenceNotes !== undefined && ts.referenceNotes !== referenceNotes) setReferenceNotes(ts.referenceNotes);
      if (ts.referenceFileName !== undefined && ts.referenceFileName !== referenceFileName) setReferenceFileName(ts.referenceFileName);
      
      if (ts.flashcards !== undefined && JSON.stringify(ts.flashcards) !== JSON.stringify(flashcards)) {
        setFlashcards(ts.flashcards);
      }
      if (ts.quizQuestions !== undefined && JSON.stringify(ts.quizQuestions) !== JSON.stringify(quizQuestions)) {
        setQuizQuestions(ts.quizQuestions);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession?.toolState]);

  const generateStudyMaterials = (
    textToUse?: string, 
    explicitNoteId?: string | null, 
    existingMaterials?: { flashcards?: any[], quizQuestions?: any[], studyGuide?: string, reflection?: string }
  ) => {
    const text = textToUse || referenceNotes;
    const targetNoteId = explicitNoteId !== undefined ? explicitNoteId : activeNoteId;
    
    // Use explicit existing materials if passed, otherwise fall back to current tool state
    const currentCards = existingMaterials?.flashcards || flashcards;
    const currentQuizzes = existingMaterials?.quizQuestions || quizQuestions;
    const currentGuide = existingMaterials?.studyGuide || studyGuide;
    const currentReflection = existingMaterials?.reflection || reflection;

    if (!text) return;
    setIsGenerating(true);

    setTimeout(() => {
      const sentences = text
        .split(/[.?!]\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 10)
        .slice(0, 5);
      
      if (sentences.length === 0) {
        toast.error("Could not find enough text to generate materials. Try uploading longer notes.");
        setIsGenerating(false);
        return;
      }
      
      const newFlashcards = sentences.map((sentence, i) => {
        const words = sentence.split(' ');
        const mid = Math.max(1, Math.floor(words.length / 2));
        return {
          id: `gen-fc-${Date.now()}-${i}`,
          front: words.slice(0, mid).join(' ') + '...',
          back: words.slice(mid).join(' ') || words[0]
        };
      });

      const newQuizzes = sentences.map((sentence, i) => {
        const words = sentence.split(' ');
        let targetWord = words[0] || 'Term';
        let targetIdx = 0;
        for (let w = 0; w < words.length; w++) {
            if (words[w].length > targetWord.length) {
                targetWord = words[w];
                targetIdx = w;
            }
        }
        const options = [targetWord, 'Concept', 'Definition', 'Theory'];
        options.sort(() => Math.random() - 0.5);
        const aIdx = options.indexOf(targetWord);
        const q = words.slice(0, targetIdx).join(' ') + ' ____ ' + words.slice(targetIdx+1).join(' ');

        return {
          id: `gen-qz-${Date.now()}-${i}`,
          q: q + '?',
          options,
          a: aIdx
        };
      });

      const newGuide = "### Generated Study Guide\n\n" + sentences.map(s => `- ${s}`).join('\n') + "\n\n" + currentGuide;
      const newReflection = "What did you find most interesting about these notes?\n\nHow does this connect to what you already know?\n\n" + currentReflection;

      const finalFlashcards = [...newFlashcards, ...currentCards];
      const finalQuizzes = [...newQuizzes, ...currentQuizzes];

      setFlashcards(finalFlashcards);
      setQuizQuestions(finalQuizzes);
      setStudyGuide(newGuide);
      setReflection(newReflection);

      syncToolState({
        flashcards: finalFlashcards,
        quizQuestions: finalQuizzes,
        studyGuide: newGuide,
        reflection: newReflection
      });

      if (targetNoteId) {
        updateNote(targetNoteId, {
          generatedFlashcards: finalFlashcards,
          generatedQuizQuestions: finalQuizzes,
          generatedStudyGuide: newGuide,
          generatedReflectionPrompts: newReflection
        });
      }

      setIsGenerating(false);
      toast.success("Successfully generated flashcards, quizzes, study guide, and reflection prompts!");
    }, 1500);
  };

  const tools = [
    {
      id: 'flashcards',
      name: 'Flashcards',
      description: 'Create and review flashcard sets',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      available: true,
    },
    {
      id: 'quiz',
      name: 'Quiz Mode',
      description: 'Test your knowledge with quizzes',
      icon: Brain,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      available: true,
    },
    {
      id: 'study-guide',
      name: 'Study Guide',
      description: 'Build structured study guides',
      icon: FileText,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      available: true,
    },
    {
      id: 'reflection',
      name: 'Reflection Notes',
      description: 'Journal your learning journey',
      icon: Sparkles,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100',
      available: true,
    },
  ];

  const handleToolClick = (toolId: string) => {
    setActiveTool(toolId);
    setFlashcardMode('list');
    setQuizMode('list');
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setCurrentQuizIndex(0);
    setScore(0);
    setSelectedOption(null);
    syncToolState({
      activeTool: toolId, flashcardMode: 'list', quizMode: 'list',
      currentCardIndex: 0, isFlipped: false, currentQuizIndex: 0, score: 0
    });
  };

  const handleSaveNote = (generate: boolean) => {
    if (!pendingUpload) return;
    
    const tagsArray = uploadForm.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    const newNote = addNote({
      title: uploadForm.title,
      course: '', // Inferred or added to form if needed
      category: uploadForm.category,
      tags: tagsArray,
      fileName: pendingUpload.name,
      fileType: pendingUpload.name.endsWith('.docx') || pendingUpload.name.endsWith('.doc') ? 'docx' : 'txt',
      rawText: pendingUpload.content,
      isDeleted: false,
      visibility: uploadForm.visibility,
      sharedSessionIds: [],
      generatedFlashcards: [],
      generatedQuizQuestions: [],
      generatedStudyGuide: '',
      generatedReflectionPrompts: ''
    });
    
    setReferenceNotes(pendingUpload.content);
    setReferenceFileName(uploadForm.title);
    setActiveNoteId(newNote.id);
    
    // Clear tools since this is a new document
    setFlashcards([]);
    setQuizQuestions([]);
    setStudyGuide('');
    setReflection('');
    
    syncToolState({ 
      referenceNotes: pendingUpload.content, 
      referenceFileName: uploadForm.title,
      flashcards: [],
      quizQuestions: [],
      studyGuide: '',
      reflection: ''
    });
    
    setPendingUpload(null);
    setLibraryMode(false);
    
    if (generate) {
      toast.success("Note saved! Generating materials...");
      generateStudyMaterials(pendingUpload.content, newNote.id, {
        flashcards: [], quizQuestions: [], studyGuide: '', reflection: ''
      });
    } else {
      toast.success("Note saved to library!");
    }
  };

  const handleGenerateOnly = () => {
    if (!pendingUpload) return;
    setReferenceNotes(pendingUpload.content);
    setReferenceFileName(pendingUpload.name);
    setActiveNoteId(null);
    
    // Clear tools since this is a new document
    setFlashcards([]);
    setQuizQuestions([]);
    setStudyGuide('');
    setReflection('');

    syncToolState({ 
      referenceNotes: pendingUpload.content, 
      referenceFileName: pendingUpload.name,
      flashcards: [],
      quizQuestions: [],
      studyGuide: '',
      reflection: ''
    });
    
    setPendingUpload(null);
    setLibraryMode(false);
    
    generateStudyMaterials(pendingUpload.content, null, {
      flashcards: [], quizQuestions: [], studyGuide: '', reflection: ''
    });
  };

  const handleOpenNote = (note: SavedNote) => {
    setReferenceNotes(note.rawText);
    setReferenceFileName(note.title);
    setActiveNoteId(note.id);
    
    // Load generated materials from note if they exist
    if (note.generatedFlashcards?.length) setFlashcards(note.generatedFlashcards);
    else setFlashcards([]);
    
    if (note.generatedQuizQuestions?.length) setQuizQuestions(note.generatedQuizQuestions);
    else setQuizQuestions([]);
    
    if (note.generatedStudyGuide) setStudyGuide(note.generatedStudyGuide);
    else setStudyGuide('');
    
    if (note.generatedReflectionPrompts) setReflection(note.generatedReflectionPrompts);
    else setReflection('');
    
    syncToolState({ 
      referenceNotes: note.rawText, 
      referenceFileName: note.title,
      flashcards: note.generatedFlashcards || [],
      quizQuestions: note.generatedQuizQuestions || [],
      studyGuide: note.generatedStudyGuide || '',
      reflection: note.generatedReflectionPrompts || ''
    });
    setLibraryMode(false);
  };

  const handleGenerateFromLibrary = (note: SavedNote) => {
    handleOpenNote(note);
    generateStudyMaterials(note.rawText, note.id, {
      flashcards: note.generatedFlashcards || [],
      quizQuestions: note.generatedQuizQuestions || [],
      studyGuide: note.generatedStudyGuide || '',
      reflection: note.generatedReflectionPrompts || ''
    });
  };

  const handleAddFlashcard = () => {
    if (newFront.trim() && newBack.trim()) {
      const updated = [...flashcards, { id: Date.now().toString(), front: newFront, back: newBack }];
      setFlashcards(updated);
      syncToolState({ flashcards: updated });
      setNewFront('');
      setNewBack('');
    }
  };

  const handleDeleteFlashcard = (id: string) => {
    const updated = flashcards.filter(c => c.id !== id);
    setFlashcards(updated);
    syncToolState({ flashcards: updated });
  };

  const handleAddQuizQuestion = () => {
    if (newQ.trim() && newOptions.every(o => o.trim())) {
      const updated = [...quizQuestions, { id: Date.now().toString(), q: newQ, options: newOptions, a: newA }];
      setQuizQuestions(updated);
      syncToolState({ quizQuestions: updated });
      setNewQ('');
      setNewOptions(['', '', '', '']);
      setNewA(0);
    }
  };

  const handleDeleteQuizQuestion = (id: string) => {
    const updated = quizQuestions.filter(q => q.id !== id);
    setQuizQuestions(updated);
    syncToolState({ quizQuestions: updated });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          const content = result.value || 'No text could be extracted from this document.';
          setPendingUpload({ name: file.name, content });
          setUploadForm(prev => ({ ...prev, title: file.name.split('.')[0] }));
        } catch (error) {
          console.error('Error parsing Word document:', error);
          setPendingUpload({ name: file.name, content: 'Error parsing Word document. Please ensure it is a .docx format.' });
          setUploadForm(prev => ({ ...prev, title: file.name.split('.')[0] }));
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setPendingUpload({ name: file.name, content });
        setUploadForm(prev => ({ ...prev, title: file.name.split('.')[0] }));
      };
      reader.readAsText(file);
    }
    // clear input
    e.target.value = '';
  };

  const renderReferenceButton = () => (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white/20 hover:bg-white/30 transition-colors text-white ml-auto">
          <FileText size={18} />
          <span className="hidden sm:inline">{referenceFileName ? 'Reference Notes' : 'Notes Library'}</span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md border-l border-slate-200 shadow-2xl flex flex-col h-full bg-white z-[100]">
        <SheetHeader className="pb-4 border-b border-slate-100 flex-shrink-0 flex flex-row items-center justify-between">
          <div>
            <SheetTitle className="text-xl font-bold text-slate-800">
              {pendingUpload ? "Save Note" : libraryMode ? "My Notes Library" : "Reference Notes"}
            </SheetTitle>
            <SheetDescription className="sr-only">Upload and view reference notes</SheetDescription>
          </div>
        </SheetHeader>
        <div className="mt-4 flex-1 overflow-hidden flex flex-col">
          {pendingUpload ? (
            <div className="flex flex-col h-full space-y-4 animate-in fade-in zoom-in-95">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
                <p className="font-bold text-slate-700 mb-1">File: {pendingUpload.name}</p>
                <p className="text-slate-500 truncate">{pendingUpload.content.substring(0, 100)}...</p>
              </div>
              <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                  <input type="text" value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                  <select value={uploadForm.category} onChange={e => setUploadForm({...uploadForm, category: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                    <option>Course</option>
                    <option>Unit / Chapter</option>
                    <option>Exam / Quiz</option>
                    <option>Weekly Notes</option>
                    <option>Group Project</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tags (comma separated)</label>
                  <input type="text" placeholder="e.g. Phase 4, Sorting" value={uploadForm.tags} onChange={e => setUploadForm({...uploadForm, tags: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Visibility</label>
                  <div className="flex gap-2">
                    <button onClick={() => setUploadForm({...uploadForm, visibility: 'private'})} className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-colors ${uploadForm.visibility === 'private' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Private</button>
                    <button onClick={() => setUploadForm({...uploadForm, visibility: 'shared'})} className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-colors ${uploadForm.visibility === 'shared' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Shared Session</button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                <button onClick={() => handleSaveNote(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-200">
                  <Sparkles size={16} /> Save + Generate Materials
                </button>
                <div className="flex gap-2">
                  <button onClick={() => handleSaveNote(false)} className="flex-1 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-2 px-2 rounded-xl transition-colors text-xs">
                    Save for Later
                  </button>
                  <button onClick={handleGenerateOnly} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-2 rounded-xl transition-colors text-xs">
                    Generate Only
                  </button>
                </div>
                <button onClick={() => setPendingUpload(null)} className="mt-2 text-slate-500 hover:text-slate-700 text-sm font-bold text-center">
                  Cancel
                </button>
              </div>
            </div>
          ) : libraryMode ? (
            <div className="flex flex-col h-full space-y-4">
              <div className="mb-2">
                <label className="w-full border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 text-blue-600 py-3 rounded-xl cursor-pointer font-bold transition-colors flex items-center justify-center text-sm">
                  <Upload size={16} className="mr-2" /> Upload New Notes
                  <input type="file" accept=".txt,.md,.csv,.doc,.docx" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              {referenceNotes && (
                <button 
                  onClick={() => setLibraryMode(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <ArrowLeft size={16} /> Return to Active Notes
                </button>
              )}
              <NotesLibrary onOpenNote={handleOpenNote} onGenerateMaterials={handleGenerateFromLibrary} />
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-4">
              <button 
                onClick={() => setLibraryMode(true)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Folder size={16} /> Browse My Notes Library
              </button>
              <div className="flex flex-col gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
                      <FileText size={18} />
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{referenceFileName}</h4>
                      <p className="text-xs text-slate-500 font-medium">{referenceNotes.length} characters</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setReferenceNotes('');
                      setReferenceFileName('');
                      setActiveNoteId(null);
                      setFlashcards([]);
                      setQuizQuestions([]);
                      setStudyGuide('');
                      setReflection('');
                      syncToolState({ 
                        referenceNotes: '', 
                        referenceFileName: '',
                        flashcards: [],
                        quizQuestions: [],
                        studyGuide: '',
                        reflection: ''
                      });
                      setLibraryMode(true);
                    }} 
                    className="p-2 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded-lg transition-colors ml-2 flex-shrink-0"
                    title="Close file"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <button 
                  onClick={() => generateStudyMaterials()}
                  disabled={isGenerating}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Sparkles size={16} className={isGenerating ? "animate-pulse" : ""} />
                  {isGenerating ? "Generating Magic..." : "Auto-Generate Study Materials"}
                </button>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-slate-700 text-sm whitespace-pre-wrap font-mono flex-1 overflow-y-auto shadow-inner leading-relaxed">
                {referenceNotes}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  if (activeTool === 'flashcards') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <header className="bg-blue-600 text-white px-6 pt-12 pb-8 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => { setActiveTool(null); syncToolState({ activeTool: null }); }} className="hover:bg-white/10 rounded-lg p-2">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold">Flashcards</h1>
            </div>
            {renderReferenceButton()}
          </div>
          <div className="flex gap-4 ml-14">
            <button 
              onClick={() => { setFlashcardMode('list'); syncToolState({ flashcardMode: 'list' }); }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${flashcardMode === 'list' ? 'bg-white text-blue-600' : 'bg-blue-700 hover:bg-blue-800'}`}
            >
              Edit Deck
            </button>
            <button 
              onClick={() => { setFlashcardMode('study'); setCurrentCardIndex(0); setIsFlipped(false); syncToolState({ flashcardMode: 'study', currentCardIndex: 0, isFlipped: false }); }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${flashcardMode === 'study' ? 'bg-white text-blue-600' : 'bg-blue-700 hover:bg-blue-800'}`}
              disabled={flashcards.length === 0}
            >
              Study Now
            </button>
          </div>
        </header>

        <div className="p-6">
          {flashcardMode === 'list' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <Card className="p-6 bg-white shadow-sm border-blue-100">
                <h3 className="font-bold text-blue-900 mb-4">Create New Card</h3>
                <div className="space-y-4">
                  <input type="text" placeholder="Front (Question/Term)" value={newFront} onChange={(e) => setNewFront(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  <textarea placeholder="Back (Answer/Definition)" value={newBack} onChange={(e) => setNewBack(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] resize-y" />
                  <button onClick={handleAddFlashcard} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors w-full flex items-center justify-center">
                    <Plus className="mr-2" size={20} /> Add Card
                  </button>
                </div>
              </Card>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-lg">Your Deck ({flashcards.length})</h3>
                {flashcards.map((card) => (
                  <Card key={card.id} className="p-4 flex justify-between items-start group">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-slate-800 mb-1">Q: {card.front}</p>
                      <p className="text-slate-600 text-sm">A: {card.back}</p>
                    </div>
                    <button onClick={() => handleDeleteFlashcard(card.id)} className="text-slate-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={18} />
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {flashcardMode === 'study' && flashcards.length > 0 && (
            <div className="flex flex-col items-center justify-center max-w-lg mx-auto py-10">
              <div 
                onClick={() => { setIsFlipped(!isFlipped); syncToolState({ isFlipped: !isFlipped }); }}
                className="w-full aspect-[4/3] cursor-pointer mb-8"
                style={{ perspective: '1000px' }}
              >
                <div 
                  className={`relative w-full h-full transition-transform duration-500`}
                  style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)' }}
                >
                  <Card 
                    className="absolute w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white border-2 border-blue-100 shadow-xl rounded-3xl"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <p className="text-2xl font-bold text-slate-800">{flashcards[currentCardIndex].front}</p>
                    <p className="absolute bottom-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Tap to flip</p>
                  </Card>
                  <Card 
                    className="absolute w-full h-full flex flex-col items-center justify-center p-8 text-center bg-blue-50 border-2 border-blue-200 shadow-xl rounded-3xl"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <p className="text-xl font-medium text-blue-900">{flashcards[currentCardIndex].back}</p>
                    <p className="absolute bottom-6 text-xs font-bold text-blue-400 uppercase tracking-widest">Tap to flip</p>
                  </Card>
                </div>
              </div>

              <div className="flex items-center justify-between w-full px-4">
                <button 
                  onClick={() => { const val = Math.max(0, currentCardIndex - 1); setCurrentCardIndex(val); setIsFlipped(false); syncToolState({ currentCardIndex: val, isFlipped: false }); }}
                  disabled={currentCardIndex === 0}
                  className="p-4 rounded-full bg-white shadow-md text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <span className="font-bold text-slate-500">
                  {currentCardIndex + 1} / {flashcards.length}
                </span>
                <button 
                  onClick={() => { const val = Math.min(flashcards.length - 1, currentCardIndex + 1); setCurrentCardIndex(val); setIsFlipped(false); syncToolState({ currentCardIndex: val, isFlipped: false }); }}
                  disabled={currentCardIndex === flashcards.length - 1}
                  className="p-4 rounded-full bg-white shadow-md text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTool === 'quiz') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <header className="bg-purple-600 text-white px-6 pt-12 pb-8 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => { setActiveTool(null); syncToolState({ activeTool: null }); }} className="hover:bg-white/10 rounded-lg p-2">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold">Quiz Mode</h1>
            </div>
            {renderReferenceButton()}
          </div>
          <div className="flex gap-4 ml-14">
            <button 
              onClick={() => { setQuizMode('list'); syncToolState({ quizMode: 'list' }); }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${quizMode === 'list' ? 'bg-white text-purple-600' : 'bg-purple-700 hover:bg-purple-800'}`}
            >
              Edit Quiz
            </button>
            <button 
              onClick={() => { setQuizMode('take'); setCurrentQuizIndex(0); setScore(0); setSelectedOption(null); syncToolState({ quizMode: 'take', currentQuizIndex: 0, score: 0 }); }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${quizMode === 'take' || quizMode === 'results' ? 'bg-white text-purple-600' : 'bg-purple-700 hover:bg-purple-800'}`}
              disabled={quizQuestions.length === 0}
            >
              Take Quiz
            </button>
          </div>
        </header>

        <div className="p-6">
          {quizMode === 'list' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <Card className="p-6 bg-white shadow-sm border-purple-100">
                <h3 className="font-bold text-purple-900 mb-4">Add Question</h3>
                <div className="space-y-4">
                  <input type="text" placeholder="Question text..." value={newQ} onChange={(e) => setNewQ(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium" />
                  
                  <div className="space-y-2">
                    {newOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="correct_answer" 
                          checked={newA === i} 
                          onChange={() => setNewA(i)}
                          className="w-5 h-5 text-purple-600"
                        />
                        <input 
                          type="text" 
                          placeholder={`Option ${i + 1}`} 
                          value={opt} 
                          onChange={(e) => {
                            const opts = [...newOptions];
                            opts[i] = e.target.value;
                            setNewOptions(opts);
                          }} 
                          className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" 
                        />
                      </div>
                    ))}
                  </div>

                  <button onClick={handleAddQuizQuestion} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-colors w-full flex items-center justify-center mt-4">
                    <Plus className="mr-2" size={20} /> Add Question
                  </button>
                </div>
              </Card>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-lg">Quiz Bank ({quizQuestions.length})</h3>
                {quizQuestions.map((q, i) => (
                  <Card key={q.id} className="p-5 flex justify-between items-start group">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-slate-800 mb-3">{i + 1}. {q.q}</p>
                      <ul className="space-y-1">
                        {q.options.map((opt, j) => (
                          <li key={j} className={`text-sm flex items-center ${q.a === j ? 'text-green-600 font-bold' : 'text-slate-500'}`}>
                            {q.a === j && <CheckCircle size={14} className="mr-2" />}
                            {q.a !== j && <span className="w-[14px] mr-2 inline-block">•</span>}
                            {opt}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button onClick={() => handleDeleteQuizQuestion(q.id)} className="text-slate-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={18} />
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {quizMode === 'take' && quizQuestions.length > 0 && (
            <div className="max-w-2xl mx-auto py-8">
              <div className="flex justify-between items-center mb-8">
                <span className="font-bold text-slate-500">Question {currentQuizIndex + 1} of {quizQuestions.length}</span>
                <span className="font-bold text-purple-600">Score: {score}</span>
              </div>
              
              <Card className="p-8 bg-white shadow-xl border-purple-100 rounded-3xl mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-8 leading-relaxed">
                  {quizQuestions[currentQuizIndex].q}
                </h2>
                
                <div className="space-y-3">
                  {quizQuestions[currentQuizIndex].options.map((opt, i) => {
                    const isSelected = selectedOption === i;
                    const isCorrect = quizQuestions[currentQuizIndex].a === i;
                    const showResult = selectedOption !== null;
                    
                    let bgClass = "bg-slate-50 hover:bg-slate-100 border-slate-200";
                    let icon = null;
                    
                    if (showResult) {
                      if (isCorrect) {
                        bgClass = "bg-green-50 border-green-300 text-green-800";
                        icon = <CheckCircle size={20} className="text-green-500" />;
                      } else if (isSelected) {
                        bgClass = "bg-red-50 border-red-300 text-red-800";
                        icon = <XCircle size={20} className="text-red-500" />;
                      } else {
                        bgClass = "bg-slate-50 border-slate-200 opacity-50";
                      }
                    } else if (isSelected) {
                      bgClass = "bg-purple-50 border-purple-300 text-purple-800";
                    }

                    return (
                      <button 
                        key={i}
                        onClick={() => {
                          if (!showResult) {
                            setSelectedOption(i);
                            syncToolState({ selectedOption: i });
                            
                            const isCorrectAnswer = i === quizQuestions[currentQuizIndex].a;
                            if (isCorrectAnswer) {
                              confetti({
                                particleCount: 100,
                                spread: 70,
                                origin: { y: 0.6 }
                              });
                              toast.success("Great job! You got it right! 🎯");
                            } else {
                              toast.error("So close! Review the answer and try again.");
                            }
                          }
                        }}
                        disabled={showResult}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${bgClass}`}
                      >
                        <span className="font-medium">{opt}</span>
                        {icon}
                      </button>
                    );
                  })}
                </div>
              </Card>

              {selectedOption !== null && (
                <div className="flex justify-end animate-in fade-in slide-in-from-bottom-4">
                  <button 
                    onClick={() => {
                      let newScore = score;
                      if (selectedOption === quizQuestions[currentQuizIndex].a) {
                        newScore = score + 1;
                        setScore(newScore);
                      }
                      if (currentQuizIndex === quizQuestions.length - 1) {
                        setQuizMode('results');
                        syncToolState({ score: newScore, quizMode: 'results' });
                      } else {
                        const newIndex = currentQuizIndex + 1;
                        setCurrentQuizIndex(newIndex);
                        setSelectedOption(null);
                        syncToolState({ score: newScore, currentQuizIndex: newIndex, selectedOption: null });
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg flex items-center transition-transform hover:scale-105"
                  >
                    {currentQuizIndex === quizQuestions.length - 1 ? 'See Results' : 'Next Question'} <ChevronRight className="ml-2" size={20} />
                  </button>
                </div>
              )}
            </div>
          )}

          {quizMode === 'results' && (
            <div className="max-w-lg mx-auto py-12 text-center">
              <div className="w-32 h-32 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Brain size={64} />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800 mb-4">Quiz Complete!</h2>
              <p className="text-xl text-slate-600 mb-8">
                You scored <span className="font-bold text-purple-600 text-3xl mx-1">{score}</span> out of {quizQuestions.length}
              </p>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => { setQuizMode('take'); setCurrentQuizIndex(0); setScore(0); setSelectedOption(null); syncToolState({ quizMode: 'take', currentQuizIndex: 0, score: 0, selectedOption: null }); }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-transform hover:scale-105"
                >
                  Retake Quiz
                </button>
                <button 
                  onClick={() => { setActiveTool(null); syncToolState({ activeTool: null }); }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 px-8 rounded-xl transition-colors"
                >
                  Back to Tools
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTool === 'study-guide') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <header className="bg-green-600 text-white px-6 pt-12 pb-8 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => { setActiveTool(null); syncToolState({ activeTool: null }); }} className="hover:bg-white/10 rounded-lg p-2">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold">Study Guide</h1>
            </div>
            {renderReferenceButton()}
          </div>
        </header>
        <div className="p-6 max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
          <Card className="flex-1 p-6 bg-white shadow-xl border-green-100 rounded-3xl flex flex-col">
            <input 
              type="text" 
              placeholder="Guide Title..." 
              className="text-2xl font-bold text-green-900 placeholder-green-200 outline-none border-b-2 border-green-100 pb-4 mb-4 bg-transparent"
            />
            <textarea 
              value={studyGuide}
              onChange={(e) => setStudyGuide(e.target.value)}
              onBlur={() => syncToolState({ studyGuide })}
              placeholder="Start typing your study notes here. You can structure them however you like..." 
              className="flex-1 w-full outline-none resize-none text-slate-700 leading-relaxed bg-transparent"
            />
          </Card>
        </div>
      </div>
    );
  }

  if (activeTool === 'reflection') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <header className="bg-orange-600 text-white px-6 pt-12 pb-8 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => { setActiveTool(null); syncToolState({ activeTool: null }); }} className="hover:bg-white/10 rounded-lg p-2">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold">Reflection Notes</h1>
            </div>
            {renderReferenceButton()}
          </div>
        </header>
        <div className="p-6 max-w-2xl mx-auto h-[calc(100vh-140px)] flex flex-col">
          <Card className="flex-1 p-8 bg-orange-50/50 shadow-xl border-orange-200 rounded-3xl flex flex-col relative overflow-hidden">
            <Sparkles className="absolute top-6 right-6 text-orange-200 w-24 h-24 rotate-12" />
            <h2 className="text-xl font-bold text-orange-800 mb-6 z-10">How was your learning today?</h2>
            <textarea 
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              onBlur={() => syncToolState({ reflection })}
              placeholder="What did you struggle with? What clicked for you? Write down your thoughts to better understand your learning process..." 
              className="flex-1 w-full outline-none resize-none text-orange-900 leading-relaxed bg-white/60 p-6 rounded-2xl z-10 border border-orange-100 focus:ring-2 focus:ring-orange-300"
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 pt-12 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="hover:bg-white/10 rounded-lg p-2 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">Study Tools</h1>
          </div>
          {renderReferenceButton()}
        </div>
        <p className="text-purple-100 text-sm ml-14">
          Boost your learning with these resources
        </p>
      </header>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Info Card */}
        <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Academic Support Tools
              </h3>
              <p className="text-sm text-blue-800">
                Make your study sessions more productive with these built-in tools designed to enhance your learning.
              </p>
            </div>
          </div>
        </Card>

        {/* Tools Grid */}
        <div className="space-y-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card
                key={tool.id}
                onClick={() => tool.available && handleToolClick(tool.id)}
                className={`p-6 cursor-pointer hover:shadow-xl transition-all ${
                  tool.available ? 'bg-gradient-to-br ' + tool.bgColor : 'bg-gray-50'
                } ${tool.available ? 'border-2 hover:scale-105' : 'opacity-60'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`rounded-2xl p-4 bg-gradient-to-br ${tool.color} shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{tool.name}</h3>
                      {!tool.available && (
                        <Lock className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      {tool.description}
                    </p>
                    {tool.available ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-semibold"
                      >
                        Open Tool →
                      </Button>
                    ) : (
                      <div className="text-xs text-gray-500 font-medium">
                        Coming Soon
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Feature Highlights */}
        <Card className="p-6 shadow-lg">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">
            Why Use Study Tools?
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-green-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Active Recall</div>
                <div className="text-sm text-gray-600">
                  Test yourself to strengthen memory retention
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Spaced Repetition</div>
                <div className="text-sm text-gray-600">
                  Review material at optimal intervals
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Track Understanding</div>
                <div className="text-sm text-gray-600">
                  Identify weak areas and focus your study time
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Coming Soon */}
        <Card className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100">
          <p className="text-sm font-medium text-purple-900 mb-1">
            🚀 More tools coming soon
          </p>
          <p className="text-sm text-purple-700">
            We're working on AI-powered study recommendations, collaborative note-sharing, and personalized practice problems.
          </p>
        </Card>
      </div>
    </div>
  );
}
