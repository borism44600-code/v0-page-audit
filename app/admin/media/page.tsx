'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AdminLayout } from '@/components/admin/admin-layout'
import { 
  Upload, Search, Grid3X3, List, FolderOpen, 
  MoreHorizontal, Trash2, Download, Copy, Plus,
  Loader2, Check, X, Image as ImageIcon, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MediaItem {
  id: string
  filename: string
  original_filename: string
  mime_type: string
  size_bytes: number
  blob_url: string
  folder: string
  alt_text?: string
  caption?: string
  width?: number
  height?: number
  created_at: string
}

interface MediaFolder {
  id: string
  name: string
  slug: string
  description?: string
  count: number
}

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, 'pending' | 'uploading' | 'done' | 'error'>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // Load media and folders
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [mediaRes, foldersRes] = await Promise.all([
        fetch(`/api/media?folder=${selectedFolder}&search=${searchQuery}`),
        fetch('/api/media/folders')
      ])

      if (mediaRes.ok) {
        const { media: mediaData } = await mediaRes.json()
        setMedia(mediaData || [])
      }

      if (foldersRes.ok) {
        const { folders: foldersData } = await foldersRes.json()
        setFolders(foldersData || [])
      }
    } catch (error) {
      console.error('Error loading media:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedFolder, searchQuery])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
    const progress: Record<string, 'pending'> = {}
    files.forEach(f => progress[f.name] = 'pending')
    setUploadProgress(progress)
  }

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    setSelectedFiles(files)
    const progress: Record<string, 'pending'> = {}
    files.forEach(f => progress[f.name] = 'pending')
    setUploadProgress(progress)
  }

  // Handle upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    const folder = selectedFolder === 'all' ? 'general' : selectedFolder

    for (const file of selectedFiles) {
      setUploadProgress(prev => ({ ...prev, [file.name]: 'uploading' }))

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)

        const res = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData
        })

        if (res.ok) {
          setUploadProgress(prev => ({ ...prev, [file.name]: 'done' }))
        } else {
          setUploadProgress(prev => ({ ...prev, [file.name]: 'error' }))
        }
      } catch {
        setUploadProgress(prev => ({ ...prev, [file.name]: 'error' }))
      }
    }

    setIsUploading(false)
    
    // Reload data after uploads complete
    setTimeout(() => {
      setUploadDialogOpen(false)
      setSelectedFiles([])
      setUploadProgress({})
      loadData()
    }, 1000)
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const res = await fetch('/api/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (res.ok) {
        setMedia(prev => prev.filter(m => m.id !== id))
        setSelectedItems(prev => prev.filter(i => i !== id))
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedItems.length} files?`)) return

    for (const id of selectedItems) {
      await handleDelete(id)
    }
    setSelectedItems([])
  }

  // Handle copy URL
  const handleCopyUrl = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Handle create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const res = await fetch('/api/media/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName })
      })

      if (res.ok) {
        setNewFolderDialogOpen(false)
        setNewFolderName('')
        loadData()
      }
    } catch (error) {
      console.error('Create folder error:', error)
    }
  }

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // Select all
  const selectAll = () => {
    if (selectedItems.length === media.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(media.map(m => m.id))
    }
  }

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <AdminLayout title="Media Library">
      <div className="flex gap-6 h-[calc(100vh-12rem)]">
        {/* Sidebar - Folders */}
        <div className="w-56 shrink-0 space-y-2">
          <Button 
            className="w-full gap-2 mb-4" 
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="w-4 h-4" />
            Upload Files
          </Button>
          
          <div className="space-y-1">
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.slug)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                  selectedFolder === folder.slug 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                )}
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  {folder.name}
                </span>
                <Badge variant="secondary" className={cn(
                  'text-xs',
                  selectedFolder === folder.slug && 'bg-primary-foreground/20 text-primary-foreground'
                )}>
                  {folder.count}
                </Badge>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <Button 
              variant="outline" 
              className="w-full gap-2" 
              size="sm"
              onClick={() => setNewFolderDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              New Folder
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search files..." 
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              {selectedItems.length > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.length} selected
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 text-destructive"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </>
              )}
              <div className="flex items-center border border-border rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    viewMode === 'grid' ? 'bg-muted' : 'hover:bg-muted/50'
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    viewMode === 'list' ? 'bg-muted' : 'hover:bg-muted/50'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Select All */}
          <div className="flex items-center gap-3 py-3 border-b border-border">
            <button 
              onClick={selectAll}
              className={cn(
                'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                selectedItems.length === media.length && media.length > 0
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-border hover:border-primary'
              )}
            >
              {selectedItems.length === media.length && media.length > 0 && (
                <Check className="w-3 h-3" />
              )}
            </button>
            <span className="text-sm text-muted-foreground">
              {isLoading ? 'Loading...' : `${media.length} files`}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : media.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No files found</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  Upload your first file
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {media.map((item) => (
                  <Card 
                    key={item.id} 
                    className={cn(
                      "group overflow-hidden cursor-pointer transition-all",
                      selectedItems.includes(item.id) 
                        ? 'ring-2 ring-primary' 
                        : 'hover:ring-1 hover:ring-primary/50'
                    )}
                    onClick={() => toggleSelect(item.id)}
                  >
                    <div className="aspect-square bg-muted relative">
                      {item.mime_type.startsWith('image/') ? (
                        <img
                          src={item.blob_url}
                          alt={item.alt_text || item.original_filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className={cn(
                        'absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity',
                        selectedItems.includes(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      )}>
                        <div className={cn(
                          'w-8 h-8 rounded-full border-2 flex items-center justify-center',
                          selectedItems.includes(item.id) 
                            ? 'bg-primary border-primary text-primary-foreground' 
                            : 'border-white'
                        )}>
                          {selectedItems.includes(item.id) && <Check className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">{item.original_filename}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(item.size_bytes)}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 bg-background/80 backdrop-blur-sm"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopyUrl(item.blob_url, item.id)}>
                          <Copy className="w-4 h-4 mr-2" />
                          {copiedId === item.id ? 'Copied!' : 'Copy URL'}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={item.blob_url} download target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {media.map((item) => (
                  <div 
                    key={item.id}
                    className={cn(
                      'flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all',
                      selectedItems.includes(item.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => toggleSelect(item.id)}
                  >
                    <button 
                      className={cn(
                        'w-5 h-5 rounded border flex items-center justify-center shrink-0',
                        selectedItems.includes(item.id)
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border'
                      )}
                    >
                      {selectedItems.includes(item.id) && <Check className="w-3 h-3" />}
                    </button>
                    <div className="w-12 h-12 rounded-lg bg-muted relative overflow-hidden shrink-0">
                      {item.mime_type.startsWith('image/') ? (
                        <img 
                          src={item.blob_url} 
                          alt={item.original_filename} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.original_filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.folder} &middot; {formatSize(item.size_bytes)} &middot; {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopyUrl(item.blob_url, item.id)}>
                          <Copy className="w-4 h-4 mr-2" />
                          {copiedId === item.id ? 'Copied!' : 'Copy URL'}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={item.blob_url} download target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>Upload images and documents to the media library.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFiles.length === 0 ? (
              <label 
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="font-medium">Drop files here or click to upload</p>
                <p className="text-sm text-muted-foreground mt-1">
                  PNG, JPG, GIF, PDF up to 10MB
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            ) : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {selectedFiles.map((file) => (
                  <div key={file.name} className="flex items-center gap-3 p-3 rounded-lg border">
                    <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-sm truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{formatSize(file.size)}</span>
                    {uploadProgress[file.name] === 'uploading' && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                    )}
                    {uploadProgress[file.name] === 'done' && (
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                    )}
                    {uploadProgress[file.name] === 'error' && (
                      <X className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setUploadDialogOpen(false)
                setSelectedFiles([])
                setUploadProgress({})
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={selectedFiles.length === 0 || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Organize your media files into folders.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
