'use client';

import { api } from '@convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  File,
  Folder,
  FolderOpen,
  FolderPlus,
  Lock,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AdminGuard } from '@/components/auth/admin-guard';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
// Removed tabs; everything is handled in the file explorer panel
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../../../components/ui/context-menu';
// Local types to keep everything in this file
export type FolderNode = {
  _id: string;
  name: string;
  parentId?: string | null;
  children?: FolderNode[];
};

export type PromptNode = {
  _id: string;
  title: string;
  content: string;
  folderId?: string | null;
  usageCount: number;
  createdAt: number;
  updatedAt: number;
};

// Helper to render the recursive folder tree
function renderFolderTree(args: {
  folders: FolderNode[];
  prompts: PromptNode[];
  expanded: Record<string, boolean>;
  selectedFolderId?: string;
  onToggleFolder: (folderId: string) => void;
  onSelectFolder: (folderId: string | undefined) => void;
  onSelectPromptForEdit: (prompt: PromptNode) => void;
  onDeletePrompt: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder?: (id: string, currentName: string) => void;
  onEditPrompt?: (id: string) => void;
  onMovePromptToFolder?: (promptId: string) => void;
  onMovePromptToRoot?: (promptId: string) => void;
  level?: number;
}) {
  const {
    folders,
    prompts,
    expanded,
    selectedFolderId,
    onToggleFolder,
    onSelectFolder,
    onSelectPromptForEdit,
    onDeletePrompt,
    onDeleteFolder,
    onRenameFolder,
    onEditPrompt,
    onMovePromptToFolder,
    onMovePromptToRoot,
    level = 0,
  } = args;

  return (
    <div className="text-sm">
      {folders.map((folder) => {
        const isExpanded = expanded[folder._id];
        const isSelected = selectedFolderId === folder._id;
        const folderPrompts = prompts.filter((p) => p.folderId === folder._id);

        return (
          <div key={folder._id}>
            <ContextMenu>
              <ContextMenuTrigger>
                <div
                  className={cn(
                    'flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent hover:text-accent-foreground',
                    isSelected && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => {
                    onToggleFolder(folder._id);
                    onSelectFolder(folder._id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onToggleFolder(folder._id);
                      onSelectFolder(folder._id);
                    }
                  }}
                  style={{ paddingLeft: `${8 + level * 16}px` }}
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      onToggleFolder(folder._id);
                      onSelectFolder(folder._id);
                    }}
                  >
                  <div className="flex items-center gap-1">
                    {folder.children &&
                      folder.children.length > 0 &&
                      (isExpanded ? (
                        <ChevronDown className="h-4 w-4 opacity-70" />
                      ) : (
                        <ChevronRight className="h-4 w-4 opacity-70" />
                      ))}
                    {isExpanded ? (
                      <FolderOpen className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Folder className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <span className="flex-1 truncate">{folder.name}</span>
                  {folderPrompts.length > 0 && (
                    <span className="text-muted-foreground text-xs">
                      {folderPrompts.length}
                    </span>
                  )}
                  </button>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                {onRenameFolder && (
                  <ContextMenuItem
                    onClick={() => onRenameFolder(folder._id, folder.name)}
                  >
                    Rename Folder
                  </ContextMenuItem>
                )}
                <ContextMenuItem onClick={() => onDeleteFolder(folder._id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Folder
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>

            {isExpanded &&
              folder.children &&
              renderFolderTree({
                folders: folder.children,
                prompts,
                expanded,
                selectedFolderId,
                onToggleFolder,
                onSelectFolder,
                onSelectPromptForEdit,
                onDeletePrompt,
                onDeleteFolder,
                onRenameFolder,
                onEditPrompt,
                onMovePromptToFolder,
                onMovePromptToRoot,
                level: level + 1,
              })}

            {isExpanded &&
              folderPrompts.map((prompt) => (
                <ContextMenu key={prompt._id}>
                  <ContextMenuTrigger>
                    <button
                      type="button"
                      className="group flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1 text-left hover:bg-accent hover:text-accent-foreground"
                      onClick={() => onSelectPromptForEdit(prompt)}
                      style={{ paddingLeft: `${24 + (level + 1) * 16}px` }}
                    >
                      <File className="h-4 w-4 flex-shrink-0 text-amber-500" />
                      <span className="flex-1 truncate">{prompt.title}</span>
                      {prompt.usageCount > 0 && (
                        <span className="text-muted-foreground text-xs">
                          {prompt.usageCount}
                        </span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <Button
                          className="h-6 w-6 p-0"
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() => onSelectPromptForEdit(prompt)}
                    >
                      Edit Prompt
                    </ContextMenuItem>
                    {onMovePromptToFolder && (
                      <ContextMenuItem
                        onClick={() => onMovePromptToFolder(prompt._id)}
                      >
                        Move to Selected Folder
                      </ContextMenuItem>
                    )}
                    {onMovePromptToRoot && (
                      <ContextMenuItem
                        onClick={() => onMovePromptToRoot(prompt._id)}
                      >
                        Move to Root
                      </ContextMenuItem>
                    )}
                    <ContextMenuItem onClick={() => onDeletePrompt(prompt._id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Prompt
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
          </div>
        );
      })}

      {/* Root level prompts */}
      {level === 0 &&
        prompts
          .filter((p) => !p.folderId)
          .map((prompt) => (
            <ContextMenu key={prompt._id}>
              <ContextMenuTrigger>
                <button
                  type="button"
                  className="group flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1 text-left hover:bg-accent hover:text-accent-foreground"
                  onClick={() => onSelectPromptForEdit(prompt)}
                  style={{ paddingLeft: '8px' }}
                >
                  <File className="h-4 w-4 flex-shrink-0 text-amber-500" />
                  <span className="flex-1 truncate">{prompt.title}</span>
                  {prompt.usageCount > 0 && (
                    <span className="text-muted-foreground text-xs">
                      {prompt.usageCount}
                    </span>
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <Button
                      className="h-6 w-6 p-0"
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => onSelectPromptForEdit(prompt)}>
                  Edit Prompt
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onDeletePrompt(prompt._id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Prompt
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
    </div>
  );
}

export default function BookOfTheDeadPage() {
  const router = useRouter();
  const { subscription } = useAuthContext();
  const isProPlus = subscription?.tier === 'pro_plus';
  const gated = !isProPlus;

  // Data - using the new hierarchy query
  const folderHierarchy = useQuery(api.prompts.getFolderHierarchy, {});
  const allPrompts = useQuery(api.prompts.listPrompts, { limit: 1000 });
  const topPrompts = useQuery(api.prompts.getTopPrompts, { limit: 5 });

  // Mutations
  const createFolder = useMutation(api.prompts.createFolder);
  const updateFolder = useMutation(api.prompts.updateFolder);
  const deleteFolder = useMutation(api.prompts.deleteFolder);
  const savePrompt = useMutation(api.prompts.savePrompt);
  const deletePrompt = useMutation(api.prompts.deletePrompt);
  const updatePrompt = useMutation(api.prompts.updatePrompt);
  const recordUsage = useMutation(api.prompts.recordUsage);
  const movePrompt = useMutation(api.prompts.movePrompt);

  // UI State
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedFolderId, setSelectedFolderId] = useState<
    string | undefined
  >();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const searchedPrompts = useQuery(api.prompts.listPrompts, {
    search: debouncedQuery || undefined,
    limit: 100,
  });

  const visiblePrompts = useMemo(() => {
    return debouncedQuery ? searchedPrompts || [] : allPrompts || [];
  }, [debouncedQuery, searchedPrompts, allPrompts]);

  const handleToggleFolder = (folderId: string) => {
    setExpanded((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleCopyPrompt = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      await recordUsage({ id });
      toast.success('Prompt copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy prompt');
    }
  };

  const handleSelectPromptForEdit = (prompt: PromptNode) => {
    setEditingPromptId(prompt._id);
    setFormTitle(prompt.title);
    setFormContent(prompt.content);
  };

  const handleDeletePrompt = async (id: string) => {
    try {
      await deletePrompt({ id });
      toast.success('Prompt deleted');
    } catch (error) {
      toast.error('Failed to delete prompt');
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      await deleteFolder({ id });
      toast.success('Folder deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete folder';
      toast.error(message);
    }
  };

  const handleRenameFolder = async (id: string, currentName: string) => {
    const name = window.prompt('Rename folder', currentName)?.trim();
    if (!name || name === currentName) {
      return;
    }
    try {
      await updateFolder({ id, name });
      toast.success('Folder renamed');
    } catch (error) {
      toast.error('Failed to rename folder');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      return;
    }
    try {
      await createFolder({
        name: newFolderName,
        parentId: selectedFolderId,
      });
      setNewFolderName('');
      toast.success('Folder created');
    } catch (error) {
      toast.error('Failed to create folder');
    }
  };

  const handleSavePrompt = async () => {
    if (!(formTitle.trim() && formContent.trim())) {
      toast.error('Please enter both title and content');
      return;
    }
    try {
      if (editingPromptId) {
        await updatePrompt({
          id: editingPromptId,
          title: formTitle,
          content: formContent,
        });
        toast.success('Prompt updated');
      } else {
        await savePrompt({
          title: formTitle,
          content: formContent,
          folderId: selectedFolderId,
        });
        toast.success('Prompt saved');
      }
      setEditingPromptId(null);
      setFormTitle('');
      setFormContent('');
    } catch (error) {
      toast.error('Failed to save prompt');
    }
  };

  const handleEditPrompt = async (id: string) => {
    const prompt = (allPrompts || []).find((p: PromptNode) => p._id === id);
    const newTitle = window.prompt('Edit title', prompt?.title ?? '')?.trim();
    if (!newTitle) return;
    const newContent = window
      .prompt('Edit content', prompt?.content ?? '')
      ?.trim();
    if (newContent === undefined) return;
    try {
      await updatePrompt({
        id,
        title: newTitle,
        content: newContent,
      });
      toast.success('Prompt updated');
    } catch (error) {
      toast.error('Failed to update prompt');
    }
  };

  const handleMovePromptToFolder = async (id: string) => {
    try {
      await movePrompt({
        promptId: id,
        targetFolderId: selectedFolderId,
      });
      toast.success('Prompt moved');
    } catch (error) {
      toast.error('Failed to move prompt');
    }
  };

  const handleMovePromptToRoot = async (id: string) => {
    try {
      await movePrompt({ promptId: id });
      toast.success('Prompt moved to root');
    } catch (error) {
      toast.error('Failed to move prompt');
    }
  };

  return (
    <AdminGuard>
      <div className="h-full w-full bg-gradient-to-b from-primary/5 dark:from-primary/10">
        {/* Header strip matching app pages */}
        <div className="w-full border-border/50 border-b bg-card/30 px-3 py-3 backdrop-blur sm:px-4 md:px-6">
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text font-semibold text-2xl text-transparent sm:text-3xl">
                Prompt Library
              </h1>
              <p className="text-muted-foreground">
                Your personal prompt library with IDE-style organization
              </p>
            </div>
            {gated && (
              <Button
                onClick={() => router.push('/subscription')}
                variant="outline"
              >
                <Lock className="mr-2 h-4 w-4" /> Upgrade to Pro+
              </Button>
            )}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1600px] p-3 sm:p-4 md:p-6">
          <div
            aria-disabled={gated}
            className={cn(
              'relative grid gap-4 md:grid-cols-[320px,1fr] lg:grid-cols-[360px,1fr] xl:grid-cols-[400px,1fr]',
              gated && 'pointer-events-none opacity-60'
            )}
          >
            {/* Left: IDE-style File Explorer */}
            <div className="space-y-4">
              <Card className="flex h-[calc(100vh-200px)] flex-col border-sidebar-border/60 bg-card/60">
                <div className="flex items-center justify-between border-b bg-card/50 px-3 py-2">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <Folder className="h-4 w-4" />
                    File Explorer
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      className="h-7 w-24 text-xs"
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateFolder();
                      }}
                      placeholder="New folder"
                      value={newFolderName}
                    />
                    <Button
                      className="h-7 w-7 p-0"
                      onClick={handleCreateFolder}
                      size="sm"
                      variant="ghost"
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Search bar */}
                <div className="border-b p-2">
                  <div className="relative">
                    <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 opacity-50" />
                    <Input
                      className="h-7 pl-7 text-xs"
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search prompts..."
                      value={searchQuery}
                    />
                  </div>
                </div>

                {/* Explorer content */}
                <div className="flex-1 overflow-y-auto p-2">
                  <div className="grid gap-3 md:grid-cols-[1fr,360px] lg:grid-cols-[1fr,400px]">
                    {/* Left column: tree + prompts + most used */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        {/* "All Prompts" Root Option */}
                        <div
                          className={cn(
                            'flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground',
                            !selectedFolderId &&
                              'bg-accent text-accent-foreground'
                          )}
                          onClick={() => setSelectedFolderId(undefined)}
                        >
                          <Folder className="h-4 w-4 text-blue-500" />
                          <span className="flex-1">All Prompts</span>
                          <span className="text-muted-foreground text-xs">
                            {visiblePrompts?.filter((p) => !p.folderId)
                              .length || 0}
                          </span>
                        </div>

                        {folderHierarchy &&
                          renderFolderTree({
                            folders: folderHierarchy as FolderNode[],
                            prompts: (visiblePrompts || []) as PromptNode[],
                            expanded,
                            selectedFolderId,
                            onToggleFolder: handleToggleFolder,
                            onSelectFolder: setSelectedFolderId,
                            onSelectPromptForEdit: handleSelectPromptForEdit,
                            onDeletePrompt: handleDeletePrompt,
                            onDeleteFolder: handleDeleteFolder,
                            onRenameFolder: handleRenameFolder,
                            onEditPrompt: handleEditPrompt,
                            onMovePromptToFolder: selectedFolderId
                              ? handleMovePromptToFolder
                              : undefined,
                            onMovePromptToRoot: handleMovePromptToRoot,
                          })}
                      </div>

                      {/* Prompts in selected context */}
                      <div className="border-t pt-2">
                        <div className="mb-2 font-medium text-sm">
                          {debouncedQuery ? (
                            <>Search Results ({visiblePrompts?.length || 0})</>
                          ) : selectedFolderId ? (
                            <>
                              Folder:{' '}
                              {folderHierarchy?.find(
                                (f) => f._id === selectedFolderId
                              )?.name || 'Unknown'}
                            </>
                          ) : (
                            <>All Prompts ({visiblePrompts?.length || 0})</>
                          )}
                        </div>
                        <div className="divide-y">
                          {!visiblePrompts || visiblePrompts.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground text-sm">
                              {debouncedQuery
                                ? 'No prompts found for your search.'
                                : 'No prompts yet. Use the form to create one.'}
                            </div>
                          ) : (
                            <>
                              {visiblePrompts
                                .filter(
                                  (p) =>
                                    debouncedQuery ||
                                    !selectedFolderId ||
                                    p.folderId === selectedFolderId
                                )
                                .map((prompt) => (
                                  <ContextMenu key={prompt._id}>
                                    <ContextMenuTrigger>
                                      <div
                                        className="group grid cursor-pointer grid-cols-[1fr_auto] items-start gap-3 p-3 hover:bg-accent/50"
                                        onClick={() =>
                                          handleSelectPromptForEdit(prompt)
                                        }
                                      >
                                        <div className="min-w-0 space-y-1">
                                          <div className="flex items-center gap-2">
                                            <File className="h-4 w-4 flex-shrink-0 text-amber-500" />
                                            <span className="truncate font-medium">
                                              {prompt.title}
                                            </span>
                                            {prompt.usageCount > 0 && (
                                              <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                <Star className="h-3 w-3" />{' '}
                                                {prompt.usageCount}
                                              </span>
                                            )}
                                          </div>
                                          <div className="line-clamp-3 text-muted-foreground text-sm">
                                            {prompt.content}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                          <Button
                                            className="h-8 w-8 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleCopyPrompt(
                                                prompt.content,
                                                prompt._id
                                              );
                                            }}
                                            size="sm"
                                            variant="ghost"
                                          >
                                            <Copy className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeletePrompt(prompt._id);
                                            }}
                                            size="sm"
                                            variant="ghost"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                      <ContextMenuItem
                                        onClick={() =>
                                          handleDeletePrompt(prompt._id)
                                        }
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Prompt
                                      </ContextMenuItem>
                                      <ContextMenuItem
                                        onClick={() =>
                                          handleSelectPromptForEdit(prompt)
                                        }
                                      >
                                        Edit Prompt
                                      </ContextMenuItem>
                                    </ContextMenuContent>
                                  </ContextMenu>
                                ))}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Most Used inside Explorer (condensed) */}
                      <div className="border-t pt-2">
                        <div className="mb-2 flex items-center gap-2 font-medium text-sm">
                          <Star className="h-4 w-4" />
                          Most Used
                        </div>
                        {!topPrompts || topPrompts.length === 0 ? (
                          <div className="py-4 text-center text-muted-foreground text-sm">
                            No usage yet
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-1">
                            {topPrompts.map((prompt) => (
                              <div
                                className="group grid cursor-pointer grid-cols-[1fr_auto] items-center gap-2 rounded-sm border bg-card/50 px-2 py-1 hover:bg-accent/50"
                                key={prompt._id}
                                onClick={() =>
                                  handleCopyPrompt(
                                    prompt.content as string,
                                    prompt._id as any
                                  )
                                }
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="truncate font-medium text-xs">
                                    {prompt.title}
                                  </div>
                                  <div className="line-clamp-1 text-[11px] text-muted-foreground">
                                    {prompt.content}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                                    {prompt.usageCount}
                                  </span>
                                  <Button
                                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                                    size="sm"
                                    variant="ghost"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right column: create/edit form (sticky) */}
                    <div className="space-y-2 self-start md:sticky md:top-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">
                          {editingPromptId
                            ? 'Edit Prompt'
                            : 'Create New Prompt'}
                        </div>
                        <Button
                          onClick={() => {
                            setEditingPromptId(null);
                            setFormTitle('');
                            setFormContent('');
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          New
                        </Button>
                      </div>
                      {selectedFolderId && !editingPromptId && (
                        <div className="text-muted-foreground text-xs">
                          Target: selected folder
                        </div>
                      )}
                      <Input
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="Prompt title"
                        value={formTitle}
                      />
                      <Textarea
                        onChange={(e) => setFormContent(e.target.value)}
                        placeholder="Write your prompt content..."
                        rows={10}
                        value={formContent}
                      />
                      <Button
                        className="w-full"
                        disabled={!(formTitle.trim() && formContent.trim())}
                        onClick={handleSavePrompt}
                      >
                        {editingPromptId ? 'Update Prompt' : 'Save Prompt'}
                      </Button>
                      {editingPromptId && (
                        <Button
                          className="w-full"
                          onClick={() => {
                            setEditingPromptId(null);
                            setFormTitle('');
                            setFormContent('');
                          }}
                          variant="ghost"
                        >
                          Cancel Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {gated && (
              <div className="pointer-events-none absolute inset-0 rounded-md">
                {/* overlay handled by opacity; CTA is at header */}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
