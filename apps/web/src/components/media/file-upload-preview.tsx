'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Upload,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  Paperclip,
  Download,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  'image': FileImage,
  'video': FileVideo,
  'audio': FileAudio,
  'text': FileText,
  'code': FileCode,
  'archive': FileArchive,
  'spreadsheet': FileSpreadsheet,
  'default': File,
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return fileTypeIcons.image;
  if (type.startsWith('video/')) return fileTypeIcons.video;
  if (type.startsWith('audio/')) return fileTypeIcons.audio;
  if (type.startsWith('text/')) return fileTypeIcons.text;
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return fileTypeIcons.archive;
  if (type.includes('sheet') || type.includes('excel')) return fileTypeIcons.spreadsheet;
  if (type.includes('javascript') || type.includes('typescript') || type.includes('python')) return fileTypeIcons.code;
  return fileTypeIcons.default;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
  className
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFiles = (newFiles: File[]) => {
    // Validate file count
    if (files.length + newFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file size and type
    const validFiles = newFiles.filter(file => {
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`${file.name} exceeds ${maxSize}MB limit`);
        return false;
      }
      if (acceptedTypes && !acceptedTypes.some(type => file.type.match(type))) {
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
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes?.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Drop files here or click to browse</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Maximum {maxFiles} files, up to {maxSize}MB each
        </p>
        {acceptedTypes && (
          <p className="mt-1 text-xs text-muted-foreground">
            Accepted: {acceptedTypes.join(', ')}
          </p>
        )}
        
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
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
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <Icon className="h-8 w-8 text-muted-foreground shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    {file.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  {file.status === 'uploading' && file.progress !== undefined && (
                    <Progress value={file.progress} className="h-1 mt-1" />
                  )}
                  {file.error && (
                    <p className="text-xs text-destructive mt-1">{file.error}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {file.preview && onPreview && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onPreview(file)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {file.url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <a href={file.url} download={file.name}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {onRemove && file.status !== 'uploading' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:text-destructive"
                      onClick={() => onRemove(file.id)}
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
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Add More Files
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes?.join(',')}
          onChange={handleFileSelect}
          className="hidden"
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
              key={file.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Badge variant="secondary" className="pr-1">
                <Paperclip className="h-3 w-3 mr-1" />
                <span className="max-w-[100px] truncate">{file.name}</span>
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-destructive/20"
                    onClick={() => onRemove(file.id)}
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
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3 w-3" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedTypes?.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        )}
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {files.map((file) => {
            const Icon = getFileIcon(file.type);
            const isImage = file.type.startsWith('image/');
            
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="relative group overflow-hidden">
                  <div className="aspect-square relative">
                    {isImage && file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Icon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {file.status === 'uploading' && file.progress !== undefined && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                          <p className="text-sm">{file.progress}%</p>
                        </div>
                      </div>
                    )}
                    
                    {file.status === 'error' && (
                      <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-xs truncate">{file.name}</p>
                        <p className="text-white/80 text-xs">{formatFileSize(file.size)}</p>
                      </div>
                      
                      <div className="absolute top-2 right-2 flex gap-1">
                        {file.preview && onPreview && (
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onPreview(file)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {onRemove && file.status !== 'uploading' && (
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onRemove(file.id)}
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card
              className="aspect-square flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors border-dashed"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Add File</p>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes?.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

export default FileUploadPreview;