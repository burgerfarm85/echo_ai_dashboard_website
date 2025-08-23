import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Cloud, Download, FileSpreadsheet, RefreshCw, Folder } from 'lucide-react';
import { listBucketFiles, downloadFromBucket, type BucketFile } from '../../services/apiService';
import { useToast } from '../ui/use-toast';
import * as XLSX from 'xlsx';
import { ProcessingLottie } from '../animations/ProcessingLottie';
import burgerFarmLogo from '../../assets/burger-farm-logo.png';

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
    <Card className="glass-effect border-0 shadow-elegant overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 dashboard-gradient rounded-lg">
            <Cloud className="h-5 w-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <img src={burgerFarmLogo} alt="Burger Farm" className="h-6 w-6" />
            <span>EchoAI Cloud Storage</span>
          </div>
        </CardTitle>
        <CardDescription className="text-base">
          Access your processed customer feedback files directly from Google Cloud Platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 relative">
        {/* Bucket Selector */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-background/80 to-background/40 rounded-xl border border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 dashboard-gradient rounded-lg">
              <Folder className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Storage Location:</span>
          </div>
          <Select value={selectedBucket} onValueChange={(value) => setSelectedBucket(value as 'echo-ai-uploads' | 'echo-ai-processed')}>
            <SelectTrigger className="w-80 border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="echo-ai-processed" className="p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧠</span>
                  <div>
                    <div className="font-semibold">echo-ai-processed</div>
                    <div className="text-xs text-muted-foreground">AI-analyzed customer insights</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="echo-ai-uploads" className="p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📤</span>
                  <div>
                    <div className="font-semibold">echo-ai-uploads</div>
                    <div className="text-xs text-muted-foreground">Raw customer feedback files</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchBucketFiles}
            disabled={refreshing}
            className="gap-2 hover:scale-105 transition-transform duration-200"
          >
            {refreshing ? (
              <ProcessingLottie size={16} />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {refreshing ? 'Syncing...' : 'Refresh'}
          </Button>
        </div>

        {/* Files List */}
        <div className="space-y-4">
          {files.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative mb-6">
                {refreshing ? (
                  <div className="flex items-center justify-center">
                    <ProcessingLottie size={60} />
                    <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                  </div>
                ) : (
                  <FileSpreadsheet className="h-16 w-16 mx-auto text-muted-foreground" />
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {refreshing ? 'Syncing with EchoAI Cloud...' : 'No Customer Data Files Found'}
              </h3>
              <p className="text-muted-foreground text-lg mb-4">
                {refreshing ? 'Loading your processed customer feedback files' : 'No Excel files found in this storage location'}
              </p>
              {selectedBucket === 'echo-ai-uploads' && !refreshing && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-accent font-semibold text-sm">
                    💡 Tip: Switch to 'echo-ai-processed' for AI-analyzed customer insights
                  </p>
                </div>
              )}
            </div>
          ) : (
            files.map((file, index) => (
              <Card 
                key={file.name} 
                className="p-5 border-2 border-border/30 hover:border-primary/40 hover:shadow-xl transition-all duration-300 animate-slide-up bg-gradient-to-r from-background/80 to-background/40"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                      <div className="p-3 success-gradient rounded-xl shadow-lg">
                        <FileSpreadsheet className="h-8 w-8 text-white" />
                      </div>
                      {selectedBucket === 'echo-ai-uploads' && (
                        <div className="absolute -top-1 -right-1">
                          <ProcessingLottie size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-lg truncate mb-1">{file.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-medium">{formatFileSize(file.size)}</span>
                        <span className="font-medium">{formatDate(file.updated)}</span>
                        <Badge 
                          variant={selectedBucket === 'echo-ai-processed' ? 'default' : 'secondary'} 
                          className="text-xs px-3 py-1 font-semibold"
                        >
                          {selectedBucket === 'echo-ai-processed' ? 
                            '🧠 AI Processed' : 
                            '📤 Processing Ready'
                          }
                        </Badge>
                      </div>
                      {selectedBucket === 'echo-ai-uploads' && (
                        <div className="mt-2 text-xs text-warning font-medium">
                          ⚡ File will be processed automatically after loading
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleFileSelect(file.name)}
                      disabled={loading}
                      className="gap-2 dashboard-gradient px-6 py-3 font-semibold hover:scale-105 transition-transform duration-200 shadow-lg"
                    >
                      {loading ? (
                        <ProcessingLottie size={16} />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {selectedBucket === 'echo-ai-processed' ? 'Analyze Insights' : 'Process & Analyze'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {selectedBucket === 'echo-ai-processed' && files.length > 0 && (
          <div className="p-6 rounded-xl bg-gradient-to-r from-accent/10 to-primary/10 border-2 border-accent/30 animate-pulse-soft">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 success-gradient rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-accent text-lg">🧠 EchoAI Recommendation</span>
            </div>
            <p className="text-foreground font-medium leading-relaxed">
              These files contain <span className="text-primary font-bold">AI-processed customer insights</span> with advanced 
              sentiment clustering and meta-label analysis. Perfect for immediate deep-dive analytics and actionable business intelligence.
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-primary">✨</span>
              <span>Ready for instant visualization and trend analysis</span>
            </div>
          </div>
        )}

        {selectedBucket === 'echo-ai-uploads' && files.length > 0 && (
          <div className="p-6 rounded-xl bg-gradient-to-r from-warning/10 to-primary/10 border-2 border-warning/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 warning-gradient rounded-lg">
                <ProcessingLottie size={20} />
              </div>
              <span className="font-bold text-warning text-lg">⚡ Processing Information</span>
            </div>
            <p className="text-foreground font-medium leading-relaxed">
              These are <span className="text-warning font-bold">raw customer feedback files</span> that will be automatically 
              processed by EchoAI when loaded. Processing includes sentiment analysis, clustering, and meta-labeling.
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <ProcessingLottie size={16} />
              <span>Processing typically takes 30-60 seconds per file</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};