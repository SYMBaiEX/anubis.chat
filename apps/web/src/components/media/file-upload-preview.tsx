'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileUploadItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  preview?: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface FileUploadPreviewProps {
  files: FileUploadItem[];
  onRemove?: (fileId: string) => void;
  onUpload?: (files: File[]) => void;
  onPreview?: (file: FileUploadItem) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  variant?: 'grid' | 'list' | 'compact';
  className?: string;
}

const fileTypeIcons: Record<string, React.ComponentType<any>> = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  text: FileText,
  code: FileCode,
  archive: FileArchive,
  spreadsheet: FileSpreadsheet,
  default: File,
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) {
    return fileTypeIcons.image;
  }
  if (type.startsWith('video/')) {
    return fileTypeIcons.video;
  }
  if (type.startsWith('audio/')) {
    return fileTypeIcons.audio;
  }
  if (type.startsWith('text/')) {
    return fileTypeIcons.text;
  }
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) {
    return fileTypeIcons.archive;
  }
  if (type.includes('sheet') || type.includes('excel')) {
    return fileTypeIcons.spreadsheet;
  }
  if (
    type.includes('javascript') ||
    type.includes('typescript') ||
    type.includes('python')
  ) {
    return fileTypeIcons.code;
  }
  return fileTypeIcons.default;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
};

export function FileUploadPreview({
  files,
  onRemove,
  onUpload,
  onPreview,
  maxFiles = 10,
  maxSize = 10, // 10MB default
  acceptedTypes,
  variant = 'grid',
  className,
}: FileUploadPreviewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    },
    [handleFiles]
  );

  const handleFiles = (newFiles: File[]) => {
    // Validate file count
    if (files.length + newFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file size and type
    const validFiles = newFiles.filter((file) => {
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`${file.name} exceeds ${maxSize}MB limit`);
        return false;
      }
      if (
        acceptedTypes &&
        !acceptedTypes.some((type) => file.type.match(type))
      ) {
        toast.error(`${file.name} is not an accepted file type`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0 && onUpload) {
      onUpload(validFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  if (files.length === 0) {
    return (
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25',
          className
        )}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          accept={acceptedTypes?.join(',')}
          className="hidden"
          multiple
          onChange={handleFileSelect}
          ref={fileInputRef}
          type="file"
        />

        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 font-medium text-lg">
          Drop files here or click to browse
        </h3>
        <p className="mt-2 text-muted-foreground text-sm">
          Maximum {maxFiles} files, up to {maxSize}MB each
        </p>
        {acceptedTypes && (
          <p className="mt-1 text-muted-foreground text-xs">
            Accepted: {acceptedTypes.join(', ')}
          </p>
        )}

        <Button
          className="mt-4"
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
        >
          <Paperclip className="mr-2 h-4 w-4" />
          Select Files
        </Button>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-2', className)}>
        <AnimatePresence>
          {files.map((file) => {
            const Icon = getFileIcon(file.type);
            return (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                exit={{ opacity: 0, x: 20 }}
                initial={{ opacity: 0, x: -20 }}
                key={file.id}
              >
                <Icon className="h-8 w-8 shrink-0 text-muted-foreground" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-sm">{file.name}</p>
                    {file.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {formatFileSize(file.size)}
                  </p>
                  {file.status === 'uploading' &&
                    file.progress !== undefined && (
                      <Progress className="mt-1 h-1" value={file.progress} />
                    )}
                  {file.error && (
                    <p className="mt-1 text-destructive text-xs">
                      {file.error}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {file.preview && onPreview && (
                    <Button
                      className="h-8 w-8"
                      onClick={() => onPreview(file)}
                      size="icon"
                      variant="ghost"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {file.url && (
                    <Button
                      asChild
                      className="h-8 w-8"
                      size="icon"
                      variant="ghost"
                    >
                      <a download={file.name} href={file.url}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {onRemove && file.status !== 'uploading' && (
                    <Button
                      className="h-8 w-8 hover:text-destructive"
                      onClick={() => onRemove(file.id)}
                      size="icon"
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {file.status === 'uploading' && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {files.length < maxFiles && (
          <Button
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
          >
            <Upload className="mr-2 h-4 w-4" />
            Add More Files
          </Button>
        )}
        <input
          accept={acceptedTypes?.join(',')}
          className="hidden"
          multiple
          onChange={handleFileSelect}
          ref={fileInputRef}
          type="file"
        />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        <AnimatePresence>
          {files.map((file) => (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              initial={{ opacity: 0, scale: 0.8 }}
              key={file.id}
            >
              <Badge className="pr-1" variant="secondary">
                <Paperclip className="mr-1 h-3 w-3" />
                <span className="max-w-[100px] truncate">{file.name}</span>
                {onRemove && (
                  <Button
                    className="ml-1 h-4 w-4 hover:bg-destructive/20"
                    onClick={() => onRemove(file.id)}
                    size="icon"
                    variant="ghost"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>

        {files.length < maxFiles && (
          <>
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              variant="outline"
            >
              <Upload className="h-3 w-3" />
            </Button>
            <input
              accept={acceptedTypes?.join(',')}
              className="hidden"
              multiple
              onChange={handleFileSelect}
              ref={fileInputRef}
              type="file"
            />
          </>
        )}
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence>
          {files.map((file) => {
            const Icon = getFileIcon(file.type);
            const isImage = file.type.startsWith('image/');

            return (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.9 }}
                key={file.id}
              >
                <Card className="group relative overflow-hidden">
                  <div className="relative aspect-square">
                    {isImage && file.preview ? (
                      <img
                        alt={file.name}
                        className="h-full w-full object-cover"
                        src={file.preview}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Icon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}

                    {file.status === 'uploading' &&
                      file.progress !== undefined && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                          <div className="text-center">
                            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
                            <p className="text-sm">{file.progress}%</p>
                          </div>
                        </div>
                      )}

                    {file.status === 'error' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="absolute right-2 bottom-2 left-2">
                        <p className="truncate text-white text-xs">
                          {file.name}
                        </p>
                        <p className="text-white/80 text-xs">
                          {formatFileSize(file.size)}
                        </p>
                      </div>

                      <div className="absolute top-2 right-2 flex gap-1">
                        {file.preview && onPreview && (
                          <Button
                            className="h-7 w-7"
                            onClick={() => onPreview(file)}
                            size="icon"
                            variant="secondary"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {onRemove && file.status !== 'uploading' && (
                          <Button
                            className="h-7 w-7"
                            onClick={() => onRemove(file.id)}
                            size="icon"
                            variant="secondary"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {file.status === 'completed' && (
                      <div className="absolute top-2 left-2">
                        <CheckCircle className="h-5 w-5 text-green-500 drop-shadow" />
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {files.length < maxFiles && (
          <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0 }}>
            <Card
              className="flex aspect-square cursor-pointer items-center justify-center border-dashed transition-colors hover:bg-muted/50"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground text-sm">Add File</p>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      <input
        accept={acceptedTypes?.join(',')}
        className="hidden"
        multiple
        onChange={handleFileSelect}
        ref={fileInputRef}
        type="file"
      />
    </div>
  );
}

export default FileUploadPreview;
