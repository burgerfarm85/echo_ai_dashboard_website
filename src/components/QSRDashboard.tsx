import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Upload, FileX, BarChart3, PieChart, TrendingUp, MapPin, Star, AlertTriangle, Cloud, Layers, FileText, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { NewOverviewPanel } from './dashboard/NewOverviewPanel';
import { RegionsAnalysis } from './dashboard/RegionsAnalysis';
import { ClustersAnalysis } from './dashboard/ClustersAnalysis';
import { DetailedReviews } from './dashboard/DetailedReviews';
import { FileUpload } from './dashboard/FileUpload';
import { BucketFileManager } from './dashboard/BucketFileManager';
import burgerFarmLogo from '../assets/burger-farm-logo.png';

export interface ReviewData {
  'S.No': number;
  'Store Name': string;
  'Region': string;
  'Date': string; // DD/MM/YY format
  'Remark': string; // Actual Review
  'Subject': string;
  'Aggregator': string; // Swiggy/Zomato
  'Month': string;
  'Area Manger Name': string;
  'LLM_Cluster_Label': string; // Level 1 clusters
  'LLM_Meta_Label': string; // Level 2 clusters (deepdive)
}

const QSRDashboard: React.FC = () => {
  const [data, setData] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const handleFileUpload = (processedData: ReviewData[]) => {
    setData(processedData);
  };

  const clearData = () => {
    setData([]);
    setActiveTab('overview');
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!data.length) return null;

    const regions = [...new Set(data.map(d => d.Region))];
    const stores = [...new Set(data.map(d => d['Store Name']))];
    const llmClusters = [...new Set(data.map(d => d.LLM_Cluster_Label))];
    const metaClusters = [...new Set(data.map(d => d.LLM_Meta_Label))];

    return {
      totalReviews: data.length,
      totalRegions: regions.length,
      totalStores: stores.length,
      totalLLMClusters: llmClusters.length,
      totalMetaClusters: metaClusters.length,
      regions,
      stores,
      llmClusters,
      metaClusters
    };
  }, [data]);

  if (!data.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center gap-6 mb-8">
              <img src={burgerFarmLogo} alt="Burger Farm Logo" className="h-20 w-20 animate-float" />
              <div>
                <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Burger Farm EchoAI
                </h1>
                <p className="text-2xl text-muted-foreground mt-2">Customer Insights Analytics Platform</p>
              </div>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transform your customer feedback into actionable business intelligence. 
              Upload your data to unlock AI-powered insights, sentiment analysis, and performance trends across all your restaurant locations.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="upload" className="space-y-8">
              <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto glass-effect border-0 p-1">
                <TabsTrigger 
                  value="upload" 
                  className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
                >
                  <Upload className="h-4 w-4" />
                  Upload & Process
                </TabsTrigger>
                <TabsTrigger 
                  value="cloud" 
                  className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
                >
                  <Cloud className="h-4 w-4" />
                  Cloud Storage
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <FileUpload 
                  onFileUpload={handleFileUpload} 
                  loading={loading} 
                  setLoading={setLoading}
                />
              </TabsContent>

              <TabsContent value="cloud">
                <BucketFileManager 
                  onFileSelect={handleFileUpload} 
                  loading={loading} 
                  setLoading={setLoading}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mt-16">
            <Card className="glass-effect animate-float border-0 shadow-elegant overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5"></div>
              <CardContent className="p-6 text-center relative">
                <div className="p-3 dashboard-gradient rounded-xl w-fit mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Multi-Level Analysis</h3>
                <p className="text-sm text-muted-foreground">From overview to granular customer insights</p>
              </CardContent>
            </Card>

            <Card className="glass-effect animate-float border-0 shadow-elegant overflow-hidden" style={{ animationDelay: '0.1s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/5"></div>
              <CardContent className="p-6 text-center relative">
                <div className="p-3 success-gradient rounded-xl w-fit mx-auto mb-4">
                  <PieChart className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">AI Smart Clustering</h3>
                <p className="text-sm text-muted-foreground">Machine learning-powered sentiment categorization</p>
              </CardContent>
            </Card>

            <Card className="glass-effect animate-float border-0 shadow-elegant overflow-hidden" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-warning/10 to-warning/5"></div>
              <CardContent className="p-6 text-center relative">
                <div className="p-3 warning-gradient rounded-xl w-fit mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Regional Performance</h3>
                <p className="text-sm text-muted-foreground">Location-based insights and comparisons</p>
              </CardContent>
            </Card>

            <Card className="glass-effect animate-float border-0 shadow-elegant overflow-hidden" style={{ animationDelay: '0.3s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-destructive/5"></div>
              <CardContent className="p-6 text-center relative">
                <div className="p-3 danger-gradient rounded-xl w-fit mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Actionable Intelligence</h3>
                <p className="text-sm text-muted-foreground">Data-driven recommendations for growth</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-6 py-8">
        {/* Header with Branding */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl blur-3xl"></div>
          <Card className="glass-effect border-0 shadow-elegant relative animate-fade-in">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <img src={burgerFarmLogo} alt="Burger Farm Logo" className="h-16 w-16 animate-float" />
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Burger Farm EchoAI
                    </h1>
                    <p className="text-muted-foreground text-lg mt-1">
                      Customer Insights Dashboard - Analyzing {summaryStats?.totalReviews.toLocaleString()} reviews
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={clearData} 
                  className="gap-2 hover:scale-105 transition-transform duration-200 border-destructive/30 hover:border-destructive/60 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect border-0 shadow-card overflow-hidden animate-slide-up">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl dashboard-gradient shadow-lg">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{summaryStats?.totalReviews.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground font-medium">Customer Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-card overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/5"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl success-gradient shadow-lg">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">{summaryStats?.totalRegions}</p>
                  <p className="text-sm text-muted-foreground font-medium">Active Regions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-card overflow-hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-warning/10 to-warning/5"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl warning-gradient shadow-lg">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{summaryStats?.totalLLMClusters}</p>
                  <p className="text-sm text-muted-foreground font-medium">AI Clusters</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-card overflow-hidden animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-destructive/5"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl danger-gradient shadow-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{summaryStats?.totalMetaClusters}</p>
                  <p className="text-sm text-muted-foreground font-medium">Meta Clusters</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto glass-effect border-0 p-1">
            <TabsTrigger 
              value="overview" 
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
            >
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="cities" 
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
            >
              <MapPin className="h-4 w-4" />
              Regions
            </TabsTrigger>
            <TabsTrigger 
              value="clusters" 
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
            >
              <Layers className="h-4 w-4" />
              Clusters
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
            >
              <FileText className="h-4 w-4" />
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="animate-slide-up">
            <NewOverviewPanel data={data} summaryStats={summaryStats} />
          </TabsContent>

          <TabsContent value="cities" className="animate-slide-up">
            <RegionsAnalysis data={data} summaryStats={summaryStats} />
          </TabsContent>

          <TabsContent value="clusters" className="animate-slide-up">
            <ClustersAnalysis data={data} summaryStats={summaryStats} />
          </TabsContent>

          <TabsContent value="reviews" className="animate-slide-up">
            <DetailedReviews data={data} summaryStats={summaryStats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QSRDashboard;