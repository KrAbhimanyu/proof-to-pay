import React, { useState } from 'react';
import { User, StudentProfile, TalentCollection } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import { X, FolderPlus, BookmarkCheck, Check, Plus, Tag, StickyNote } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  creator: {
    user: User;
    profile: StudentProfile;
  };
  currentUserId: string;
  onSuccess?: (collectionName: string) => void;
}

export const TalentCollectionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  creator,
  currentUserId,
  onSuccess
}) => {
  const [collections, setCollections] = useState<TalentCollection[]>(() =>
    marketplaceStore.getTalentCollections(currentUserId)
  );
  const [selectedColId, setSelectedColId] = useState<string>(() =>
    collections[0]?.id || ''
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColColor, setNewColColor] = useState<'indigo' | 'emerald' | 'blue' | 'purple' | 'amber'>('indigo');
  const [privateNotes, setPrivateNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) {
      setErrorMsg('Please enter a collection name');
      return;
    }
    const created = marketplaceStore.createTalentCollection(
      currentUserId,
      newColName.trim(),
      newColDesc.trim(),
      newColColor
    );
    const updated = marketplaceStore.getTalentCollections(currentUserId);
    setCollections(updated);
    setSelectedColId(created.id);
    setIsCreatingNew(false);
    setNewColName('');
    setNewColDesc('');
    setErrorMsg(null);
  };

  const handleSaveToCollection = () => {
    if (!selectedColId) {
      setErrorMsg('Please select or create a collection');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    marketplaceStore.addCreatorToCollection(
      selectedColId,
      creator.user.id,
      privateNotes.trim(),
      tags
    );

    const targetCol = collections.find((c) => c.id === selectedColId);
    setIsSaved(true);
    if (onSuccess && targetCol) {
      onSuccess(targetCol.name);
    }
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <img
            src={creator.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={creator.user.name}
            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
          />
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Save to Talent Collection
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {creator.user.name} · {creator.profile.headline}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {isSaved ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Saved to Collection!</p>
            <p className="text-xs text-slate-500">Candidate added with your private notes.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Collection Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Collection
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(!isCreatingNew)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {isCreatingNew ? 'Select Existing' : 'New Collection'}
                </button>
              </div>

              {isCreatingNew ? (
                <form onSubmit={handleCreateCollection} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Collection Name *
                    </label>
                    <input
                      type="text"
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      placeholder="e.g. Q4 Senior React Devs"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Brief Description
                    </label>
                    <input
                      type="text"
                      value={newColDesc}
                      onChange={(e) => setNewColDesc(e.target.value)}
                      placeholder="e.g. Candidates for fintech project"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      {(['indigo', 'emerald', 'blue', 'purple', 'amber'] as const).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewColColor(c)}
                          className={`w-5 h-5 rounded-full border-2 transition ${
                            newColColor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                          } ${
                            c === 'indigo' ? 'bg-indigo-500' :
                            c === 'emerald' ? 'bg-emerald-500' :
                            c === 'blue' ? 'bg-blue-500' :
                            c === 'purple' ? 'bg-purple-500' : 'bg-amber-500'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                    >
                      Create
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {collections.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                      No collections yet. Click "+ New Collection" above.
                    </div>
                  ) : (
                    collections.map((col) => {
                      const isAlreadyIn = col.items.some((i) => i.creatorId === creator.user.id);
                      return (
                        <label
                          key={col.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                            selectedColId === col.id
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200 font-semibold'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="collectionSelection"
                              value={col.id}
                              checked={selectedColId === col.id}
                              onChange={() => setSelectedColId(col.id)}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{col.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {col.items.length} {col.items.length === 1 ? 'candidate' : 'candidates'}
                            {isAlreadyIn && ' (Already added)'}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Private Notes */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                <span>Private Candidate Notes (Recruiter Eyes Only)</span>
              </label>
              <textarea
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                placeholder="e.g. Strong React and Tailwind expertise, available for 20h/week starting next Monday..."
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tags (comma separated)</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Top Rated, Shortlisted, Available Now"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveToCollection}
                disabled={!selectedColId}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Save to Collection</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
