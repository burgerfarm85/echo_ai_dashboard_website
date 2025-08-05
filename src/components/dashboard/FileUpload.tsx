import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { uploadFile, checkStatus, getDownloadUrl, type StatusResponse } from '../../services/apiService';
import { useToast } from '../ui/use-toast';
import * as XLSX from 'xlsx';

interface UploadedFile {
  id: string;
  name: string;
  originalName: string;
  status: 'processing' | 'completed' | 'failed';
  uploadTime: string;
  processedFileName?: string;
}

interface FileUploadProps {
  onFileUpload: (data: any[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, loading, setLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Load uploaded files from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('uploadedFiles');
    if (saved) {
      setUploadedFiles(JSON.parse(saved));
    }
  }, []);

  // Save uploaded files to localStorage whenever the list changes
  useEffect(() => {
    localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  // Check status of processing files periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      const processingFiles = uploadedFiles.filter(f => f.status === 'processing');
      if (processingFiles.length > 0) {
        await checkProcessingStatus();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [uploadedFiles]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      await handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      toast({
        title: "File too large",
        description: "Maximum file size is 100MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const result = await uploadFile(file);
      
      const newFile: UploadedFile = {
        id: result.file_id,
        name: result.file_name,
        originalName: file.name,
        status: 'processing',
        uploadTime: new Date().toISOString(),
      };

      setUploadedFiles(prev => [newFile, ...prev]);
      
      toast({
        title: "Upload successful",
        description: "Your file is being processed. You'll be notified when it's ready.",
      });

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      handleUpload(file);
    }
  };

  const checkProcessingStatus = async () => {
    const processingFiles = uploadedFiles.filter(f => f.status === 'processing');
    
    for (const file of processingFiles) {
      try {
        const status = await checkStatus(file.name);
        if (status.status !== 'processing') {
          setUploadedFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { 
                  ...f, 
                  status: status.status, 
                  processedFileName: status.processed_file_name 
                }
              : f
          ));

          if (status.status === 'completed') {
            toast({
              title: "Processing completed",
              description: `${file.originalName} is ready for analysis`,
            });
          } else if (status.status === 'failed') {
            toast({
              title: "Processing failed",
              description: `Failed to process ${file.originalName}`,
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    }
  };

  const handleLoadProcessedFile = async (file: UploadedFile) => {
    if (!file.processedFileName) return;

    setLoading(true);
    try {
      const downloadData = await getDownloadUrl(file.processedFileName);
      
      // Fetch and process the file
      const response = await fetch(downloadData.download_url);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Process data
      const headers = jsonData[0] as string[];
      const processedData = (jsonData.slice(1) as any[][]).map(row => ({
        City: row[headers.indexOf('City')] || '',
        Reviews: row[headers.indexOf('Reviews')] || '',
        LLM_Cluster_Label: row[headers.indexOf('LLM_Cluster_Label')] || '',
        LLM_Meta_Label: row[headers.indexOf('LLM_Meta_Label')] || ''
      })).filter(item => item.City && item.Reviews);

      onFileUpload(processedData);
      
      toast({
        title: "File loaded",
        description: `Loaded ${processedData.length} reviews for analysis`,
      });
    } catch (error) {
      toast({
        title: "Load failed",
        description: error instanceof Error ? error.message : "Failed to load processed file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="glass-effect border-0 shadow-elegant animate-scale-in">
        <CardContent className="p-8">
          <div
            className="border-2 border-dashed border-primary/20 rounded-lg p-12 text-center hover:border-primary/40 transition-all duration-300 cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Uploading your file...</h3>
                  <p className="text-muted-foreground">This will be processed automatically</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full dashboard-gradient">
                  <Upload className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Upload & Process Excel File</h3>
                  <p className="text-muted-foreground mb-4">
                    Drop your .xlsx file here or click to browse. File will be automatically processed with AI.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <FileSpreadsheet className="h-4 w-4" />
                    Supports .xlsx and .xls formats (Max 100MB)
                  </div>
                </div>
                <Button className="mt-4 dashboard-gradient border-0" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Select File'}
                </Button>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Processing Status */}
      {uploadedFiles.length > 0 && (
        <Card className="glass-effect border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Processing Status</h3>
              <Button variant="outline" size="sm" onClick={checkProcessingStatus}>
                Refresh Status
              </Button>
            </div>
            <div className="space-y-3">
              {uploadedFiles.slice(0, 5).map((file) => (
                <div
                  key={file.id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    file.status === 'completed' ? 'border-accent/50 bg-accent/5' :
                    file.status === 'failed' ? 'border-destructive/50 bg-destructive/5' :
                    'border-border bg-background'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        file.status === 'completed' ? 'bg-accent text-white' :
                        file.status === 'failed' ? 'bg-destructive text-white' :
                        'bg-warning text-white'
                      }`}>
                        {file.status === 'completed' ? <CheckCircle className="h-4 w-4" /> :
                         file.status === 'failed' ? <AlertCircle className="h-4 w-4" /> :
                         <Loader2 className="h-4 w-4 animate-spin" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{file.originalName}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span>{new Date(file.uploadTime).toLocaleString()}</span>
                          <Badge variant={
                            file.status === 'completed' ? 'default' :
                            file.status === 'failed' ? 'destructive' :
                            'secondary'
                          } className="text-xs">
                            {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {file.status === 'completed' && file.processedFileName && (
                      <Button
                        onClick={() => handleLoadProcessedFile(file)}
                        disabled={loading}
                        className="gap-2 dashboard-gradient"
                        size="sm"
                      >
                        <Download className="h-4 w-4" />
                        Load for Analysis
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};