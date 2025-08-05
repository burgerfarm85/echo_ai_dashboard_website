import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Upload,
  FileX,
  BarChart3,
  PieChart,
  TrendingUp,
  MapPin,
  Star,
  AlertTriangle,
  Cloud,
} from "lucide-react";
import * as XLSX from "xlsx";
import { OverviewPanel } from "./dashboard/OverviewPanel";
import { CityAnalysis } from "./dashboard/CityAnalysis";
import { ClusterAnalysis } from "./dashboard/ClusterAnalysis";
import { DetailedReviews } from "./dashboard/DetailedReviews";
import { FileUpload } from "./dashboard/FileUpload";
import { BucketFileManager } from "./dashboard/BucketFileManager";

export interface ReviewData {
  City: string;
  Reviews: string;
  LLM_Cluster_Label: string;
  LLM_Meta_Label: string;
}

const QSRDashboard: React.FC = () => {
  const [data, setData] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleFileUpload = (processedData: ReviewData[]) => {
    setData(processedData);
  };

  const clearData = () => {
    setData([]);
    setActiveTab("overview");
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!data.length) return null;

    const cities = [...new Set(data.map((d) => d.City))];
    const llmClusters = [...new Set(data.map((d) => d.LLM_Cluster_Label))];
    const metaClusters = [...new Set(data.map((d) => d.LLM_Meta_Label))];

    return {
      totalReviews: data.length,
      totalCities: cities.length,
      totalLLMClusters: llmClusters.length,
      totalMetaClusters: metaClusters.length,
      cities,
      llmClusters,
      metaClusters,
    };
  }, [data]);

  if (!data.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center mb-12">

            {/* Gradient Blue Title with More Bottom Margin */}
            <h1 className="text-6xl font-bold tracking-tight mb-8 bg-gradient-to-r from-blue-500 to-blue-700 text-transparent bg-clip-text relative z-10">
              Burger Farm EchoAI
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload your Excel file to unlock deep insights into customer
              feedback patterns.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="upload" className="space-y-6">
              <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto glass-effect border-0">
                <TabsTrigger value="upload" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload & Process
                </TabsTrigger>
                <TabsTrigger value="cloud" className="gap-2">
                  <Cloud className="h-4 w-4" />
                  Cloud Files
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16">
            <Card className="glass-effect animate-float border-0 shadow-elegant">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold text-lg mb-2">
                  Multi-Level Analysis
                </h3>
                <p className="text-sm text-muted-foreground">
                  From overview to granular insights
                </p>
              </CardContent>
            </Card>

            <Card
              className="glass-effect animate-float border-0 shadow-elegant"
              style={{ animationDelay: "0.1s" }}
            >
              <CardContent className="p-6 text-center">
                <PieChart className="h-12 w-12 mx-auto mb-4 text-accent" />
                <h3 className="font-semibold text-lg mb-2">Smart Clustering</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered review categorization
                </p>
              </CardContent>
            </Card>

            <Card
              className="glass-effect animate-float border-0 shadow-elegant"
              style={{ animationDelay: "0.2s" }}
            >
              <CardContent className="p-6 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-warning" />
                <h3 className="font-semibold text-lg mb-2">
                  City-wise Insights
                </h3>
                <p className="text-sm text-muted-foreground">
                  Location-based performance metrics
                </p>
              </CardContent>
            </Card>

            <Card
              className="glass-effect animate-float border-0 shadow-elegant"
              style={{ animationDelay: "0.3s" }}
            >
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h3 className="font-semibold text-lg mb-2">
                  Actionable Insights
                </h3>
                <p className="text-sm text-muted-foreground">
                  Data-driven recommendations
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight dashboard-gradient text-transparent bg-clip-text">
              QSR Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Analyzing {summaryStats?.totalReviews.toLocaleString()} reviews
              across {summaryStats?.totalCities} cities
            </p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={clearData} className="gap-2">
              <FileX className="h-4 w-4" />
              Clear Data
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect border-0 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg dashboard-gradient">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {summaryStats?.totalReviews.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg success-gradient">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {summaryStats?.totalCities}
                  </p>
                  <p className="text-sm text-muted-foreground">Cities</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg warning-gradient">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {summaryStats?.totalLLMClusters}
                  </p>
                  <p className="text-sm text-muted-foreground">LLM Clusters</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg danger-gradient">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {summaryStats?.totalMetaClusters}
                  </p>
                  <p className="text-sm text-muted-foreground">Meta Clusters</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto glass-effect border-0">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="cities" className="gap-2">
              <MapPin className="h-4 w-4" />
              Cities
            </TabsTrigger>
            <TabsTrigger value="clusters" className="gap-2">
              <PieChart className="h-4 w-4" />
              Clusters
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <Star className="h-4 w-4" />
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="animate-slide-up">
            <OverviewPanel data={data} summaryStats={summaryStats} />
          </TabsContent>

          <TabsContent value="cities" className="animate-slide-up">
            <CityAnalysis data={data} />
          </TabsContent>

          <TabsContent value="clusters" className="animate-slide-up">
            <ClusterAnalysis data={data} />
          </TabsContent>

          <TabsContent value="reviews" className="animate-slide-up">
            <DetailedReviews data={data} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QSRDashboard;
