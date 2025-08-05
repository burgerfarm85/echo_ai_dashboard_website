import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Cloud, Download, FileSpreadsheet, RefreshCw, Folder } from 'lucide-react';
import { listBucketFiles, downloadFromBucket, type BucketFile } from '../../services/apiService';
import { useToast } from '../ui/use-toast';
import * as XLSX from 'xlsx';

interface BucketFileManagerProps {
  onFileSelect: (data: any[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const BucketFileManager: React.FC<BucketFileManagerProps> = ({ 
  onFileSelect, 
  loading, 
  setLoading 
}) => {
  const [selectedBucket, setSelectedBucket] = useState<'echo-ai-uploads' | 'echo-ai-processed'>('echo-ai-processed');
  const [files, setFiles] = useState<BucketFile[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchBucketFiles = async () => {
    setRefreshing(true);
    try {
      const bucketFiles = await listBucketFiles(selectedBucket);
      // Filter for Excel files only
      const excelFiles = bucketFiles.filter(file => 
        file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      );
      setFiles(excelFiles);
    } catch (error) {
      console.error('Failed to fetch bucket files:', error);
      toast({
        title: "Error",
        description: "Failed to fetch files from bucket. The bucket listing API may not be implemented yet.",
        variant: "destructive",
      });
      setFiles([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBucketFiles();
  }, [selectedBucket]);

  const handleFileSelect = async (fileName: string) => {
    setLoading(true);
    try {
      // Download file from bucket
      const blob = await downloadFromBucket(selectedBucket, fileName);
      
      // Convert blob to array buffer and process with XLSX
      const arrayBuffer = await blob.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Process data similar to FileUpload component
      const headers = jsonData[0] as string[];
      const processedData = (jsonData.slice(1) as any[][]).map(row => ({
        City: row[headers.indexOf('City')] || '',
        Reviews: row[headers.indexOf('Reviews')] || '',
        LLM_Cluster_Label: row[headers.indexOf('LLM_Cluster_Label')] || '',
        LLM_Meta_Label: row[headers.indexOf('LLM_Meta_Label')] || ''
      })).filter(item => item.City && item.Reviews);

      onFileSelect(processedData);
      
      toast({
        title: "Success",
        description: `Loaded ${processedData.length} reviews from ${fileName}`,
      });
    } catch (error) {
      console.error('Failed to load file:', error);
      toast({
        title: "Error",
        description: `Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="glass-effect border-0 shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          Cloud File Manager
        </CardTitle>
        <CardDescription>
          Access processed files directly from Google Cloud Storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bucket Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Bucket:</span>
          </div>
          <Select value={selectedBucket} onValueChange={(value) => setSelectedBucket(value as 'echo-ai-uploads' | 'echo-ai-processed')}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="echo-ai-processed">
                📊 echo-ai-processed (Recommended for Analytics)
              </SelectItem>
              <SelectItem value="echo-ai-uploads">
                📤 echo-ai-uploads (Raw Uploads)
              </SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchBucketFiles}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Files List */}
        <div className="space-y-3">
          {files.length === 0 ? (
            <div className="text-center py-8">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {refreshing ? 'Loading files...' : 'No Excel files found in this bucket'}
              </p>
              {selectedBucket === 'echo-ai-uploads' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Try switching to 'echo-ai-processed' for analyzed files
                </p>
              )}
            </div>
          ) : (
            files.map((file) => (
              <Card 
                key={file.name} 
                className="p-4 border border-border/50 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <FileSpreadsheet className="h-8 w-8 text-accent" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{file.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{formatDate(file.updated)}</span>
                        <Badge variant="outline" className="text-xs">
                          {selectedBucket === 'echo-ai-processed' ? 'Processed' : 'Raw'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleFileSelect(file.name)}
                      disabled={loading}
                      className="gap-2 dashboard-gradient"
                    >
                      <Download className="h-4 w-4" />
                      Load for Analysis
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {selectedBucket === 'echo-ai-processed' && (
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Recommendation</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Files in the 'echo-ai-processed' bucket contain pre-analyzed data with LLM clusters and meta-labels, 
              perfect for immediate analytics insights.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};