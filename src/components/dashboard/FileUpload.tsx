import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { uploadFile, checkStatus, getDownloadUrl, type StatusResponse } from '../../services/apiService';
import { useToast } from '../ui/use-toast';
import * as XLSX from 'xlsx';
import { ProcessingLottie } from '../animations/ProcessingLottie';
import { UploadLottie } from '../animations/UploadLottie';
import burgerFarmLogo from '../../assets/burger-farm-logo.png';

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
              title: "Processing completed",
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
      
      // Process data with new column structure
      const headers = jsonData[0] as string[];
      const processedData = (jsonData.slice(1) as any[][]).map(row => ({
        'S.No': row[headers.indexOf('S.No')] || 0,
        'Store Name': row[headers.indexOf('Store Name')] || '',
        'Region': row[headers.indexOf('Region')] || '',
        'Date': row[headers.indexOf('Date')] || '',
        'Remark': row[headers.indexOf('Remark')] || '',
        'Subject': row[headers.indexOf('Subject')] || '',
        'Aggregator': row[headers.indexOf('Aggregator')] || '',
        'Month': row[headers.indexOf('Month')] || '',
        'Area Manger Name': row[headers.indexOf('Area Manger Name')] || '',
        'LLM_Cluster_Label': row[headers.indexOf('LLM_Cluster_Label')] || '',
        'LLM_Meta_Label': row[headers.indexOf('LLM_Meta_Label')] || ''
      })).filter(item => item['Store Name'] && item['Remark'] && item['LLM_Cluster_Label']);

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
      {/* Hero Section with Branding */}
      <div className="text-center py-8 animate-fade-in">
        <div className="flex items-center justify-center gap-4 mb-6">
          <img src={burgerFarmLogo} alt="Burger Farm Logo" className="h-16 w-16 animate-float" />
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Burger Farm EchoAI
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Advanced Customer Insights Analytics Platform
            </p>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="glass-effect border-0 shadow-elegant animate-scale-in overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
        <CardContent className="p-8 relative">
          <div
            className="border-2 border-dashed border-primary/30 rounded-2xl p-12 text-center hover:border-primary/60 transition-all duration-500 cursor-pointer bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm hover:shadow-2xl"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <ProcessingLottie size={80} className="animate-pulse-soft" />
                  <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-primary">Uploading your file...</h3>
                  <p className="text-muted-foreground text-lg">EchoAI is preparing your data for analysis</p>
                  <div className="w-64 h-2 bg-muted rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="relative group">
                  <div className="p-6 rounded-full dashboard-gradient shadow-elegant group-hover:scale-110 transition-transform duration-300">
                    <UploadLottie size={48} />
                  </div>
                  <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-foreground">Upload & Analyze Customer Feedback</h3>
                  <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                    Drop your Excel file here or click to browse. Our AI will automatically process and cluster your customer feedback for deep insights.
                  </p>
                  <div className="flex items-center justify-center gap-3 text-muted-foreground bg-muted/30 rounded-lg p-3 max-w-md mx-auto">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <span className="font-medium">Supports .xlsx and .xls formats (Max 100MB)</span>
                  </div>
                </div>
                <Button 
                  className="mt-6 dashboard-gradient border-0 px-8 py-3 text-lg font-semibold hover:scale-105 transition-transform duration-200 shadow-elegant" 
                  disabled={uploading}
                >
                  {uploading ? 'Processing...' : 'Select Your Data File'}
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
        <Card className="glass-effect border-0 shadow-card animate-slide-up overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 dashboard-gradient rounded-lg">
                  <ProcessingLottie size={24} />
                </div>
                <h3 className="text-xl font-bold">EchoAI Processing Center</h3>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkProcessingStatus}
                className="hover:scale-105 transition-transform duration-200"
              >
                <ProcessingLottie size={16} className="mr-2" />
                Refresh Status
              </Button>
            </div>
            <div className="space-y-4">
              {uploadedFiles.slice(0, 5).map((file, index) => (
                <div
                  key={file.id}
                  className={`p-5 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                    file.status === 'completed' ? 'border-accent/50 bg-gradient-to-r from-accent/10 to-accent/5' :
                    file.status === 'failed' ? 'border-destructive/50 bg-gradient-to-r from-destructive/10 to-destructive/5' :
                    'border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-3 rounded-xl shadow-lg ${
                        file.status === 'completed' ? 'success-gradient' :
                        file.status === 'failed' ? 'danger-gradient' :
                        'warning-gradient'
                      }`}>
                        {file.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-white" />
                        ) : file.status === 'failed' ? (
                          <AlertCircle className="h-5 w-5 text-white" />
                        ) : (
                          <ProcessingLottie size={20} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg truncate">{file.originalName}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                          <span className="font-medium">{new Date(file.uploadTime).toLocaleString()}</span>
                          <Badge 
                            variant={
                              file.status === 'completed' ? 'default' :
                              file.status === 'failed' ? 'destructive' :
                              'secondary'
                            } 
                            className="text-xs px-3 py-1 font-semibold"
                          >
                            {file.status === 'processing' ? 'AI Analyzing...' : 
                             file.status === 'completed' ? 'Ready for Insights' :
                             'Processing Failed'}
                          </Badge>
                        </div>
                        {file.status === 'processing' && (
                          <div className="w-full bg-muted rounded-full h-2 mt-3 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    {file.status === 'completed' && file.processedFileName && (
                      <Button
                        onClick={() => handleLoadProcessedFile(file)}
                        disabled={loading}
                        className="gap-2 dashboard-gradient px-6 py-3 font-semibold hover:scale-105 transition-transform duration-200 shadow-lg"
                      >
                        <Download className="h-4 w-4" />
                        Analyze Insights
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
