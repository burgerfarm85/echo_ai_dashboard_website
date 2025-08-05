import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { PieChart, BarChart3, Search, Filter, TrendingDown, MapPin } from 'lucide-react';
import { ReviewData } from '../QSRDashboard';

interface ClusterAnalysisProps {
  data: ReviewData[];
}

export const ClusterAnalysis: React.FC<ClusterAnalysisProps> = ({ data }) => {
  const [selectedMetaCluster, setSelectedMetaCluster] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'count' | 'alphabetical'>('count');

  // Calculate LLM cluster statistics
  const llmClusterStats = React.useMemo(() => {
    const filtered = selectedMetaCluster === 'all' 
      ? data 
      : data.filter(d => d.LLM_Meta_Label === selectedMetaCluster);

    const clusterCounts = filtered.reduce((acc, review) => {
      const key = review.LLM_Cluster_Label;
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          cities: new Set<string>(),
          metaClusters: new Set<string>(),
          reviews: []
        };
      }
      acc[key].count++;
      acc[key].cities.add(review.City);
      acc[key].metaClusters.add(review.LLM_Meta_Label);
      acc[key].reviews.push(review);
      return acc;
    }, {} as Record<string, { count: number; cities: Set<string>; metaClusters: Set<string>; reviews: ReviewData[] }>);

    const stats = Object.entries(clusterCounts).map(([cluster, data]) => ({
      cluster,
      count: data.count,
      percentage: (data.count / filtered.length) * 100,
      cities: Array.from(data.cities),
      metaClusters: Array.from(data.metaClusters),
      reviews: data.reviews,
      avgReviewsPerCity: data.count / data.cities.size
    }));

    // Apply search filter
    const searchFiltered = searchTerm
      ? stats.filter(stat => 
          stat.cluster.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : stats;

    // Apply sorting
    return searchFiltered.sort((a, b) => {
      if (sortBy === 'count') {
        return b.count - a.count;
      } else {
        return a.cluster.localeCompare(b.cluster);
      }
    });
  }, [data, selectedMetaCluster, searchTerm, sortBy]);

  // Calculate meta cluster statistics
  const metaClusterStats = React.useMemo(() => {
    const metaCounts = data.reduce((acc, review) => {
      const key = review.LLM_Meta_Label;
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          cities: new Set<string>(),
          llmClusters: new Set<string>(),
          reviews: []
        };
      }
      acc[key].count++;
      acc[key].cities.add(review.City);
      acc[key].llmClusters.add(review.LLM_Cluster_Label);
      acc[key].reviews.push(review);
      return acc;
    }, {} as Record<string, { count: number; cities: Set<string>; llmClusters: Set<string>; reviews: ReviewData[] }>);

    return Object.entries(metaCounts)
      .map(([meta, clusterData]) => ({
        meta,
        count: clusterData.count,
        percentage: (clusterData.count / data.length) * 100,
        cities: Array.from(clusterData.cities),
        llmClusters: Array.from(clusterData.llmClusters),
        reviews: clusterData.reviews
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const metaClusters = ['all', ...metaClusterStats.map(stat => stat.meta).filter(meta => meta && meta.trim() !== '')];

  // Calculate city breakdown for selected cluster
  const getCityBreakdown = (clusterReviews: ReviewData[]) => {
    const cityCount = clusterReviews.reduce((acc, review) => {
      acc[review.City] = (acc[review.City] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(cityCount)
      .map(([city, count]) => ({
        city,
        count,
        percentage: (count / clusterReviews.length) * 100
      }))
      .sort((a, b) => b.count - a.count);
  };

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Cluster Analysis
          </CardTitle>
          <CardDescription>
            Analyze review patterns and categorizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedMetaCluster} onValueChange={setSelectedMetaCluster}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {metaClusterStats.map(stat => (
                    <SelectItem key={stat.meta} value={stat.meta}>
                      {stat.meta} ({stat.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clusters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={(value: 'count' | 'alphabetical') => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="llm-clusters" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto glass-effect border-0">
          <TabsTrigger value="llm-clusters" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            LLM Clusters
          </TabsTrigger>
          <TabsTrigger value="meta-clusters" className="gap-2">
            <PieChart className="h-4 w-4" />
            Meta Clusters
          </TabsTrigger>
        </TabsList>

        <TabsContent value="llm-clusters" className="space-y-6">
          {/* LLM Clusters Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-effect border-0 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg dashboard-gradient">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{llmClusterStats.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMetaCluster === 'all' ? 'Total' : 'Filtered'} Clusters
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-0 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg warning-gradient">
                    <TrendingDown className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {llmClusterStats[0]?.percentage.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Top Issue Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-0 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg success-gradient">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {llmClusterStats[0]?.cities.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Cities Affected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* LLM Clusters List */}
          <Card className="glass-effect border-0 shadow-card">
            <CardHeader>
              <CardTitle>Issue Clusters</CardTitle>
              <CardDescription>
                {selectedMetaCluster === 'all' 
                  ? 'All clusters across all categories'
                  : `Clusters in ${selectedMetaCluster} category`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hidden">
                {llmClusterStats.map((stat, index) => {
                  const cityBreakdown = getCityBreakdown(stat.reviews);
                  
                  return (
                    <Card key={stat.cluster} className="p-4 border border-border/50 hover:shadow-lg transition-all duration-300">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 mr-4">
                            <h4 className="font-semibold text-sm mb-2">{stat.cluster}</h4>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {stat.count} reviews ({stat.percentage.toFixed(1)}%)
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {stat.cities.length} cities
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ 
                                  backgroundColor: `hsl(var(--chart-${(index % 6) + 1}) / 0.1)`,
                                  borderColor: `hsl(var(--chart-${(index % 6) + 1}) / 0.3)`
                                }}
                              >
                                Avg {stat.avgReviewsPerCity.toFixed(1)}/city
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{stat.percentage.toFixed(1)}%</p>
                          </div>
                        </div>

                        <Progress value={stat.percentage} className="h-2" />

                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Top Affected Cities:</p>
                          <div className="flex flex-wrap gap-1">
                            {cityBreakdown.slice(0, 4).map((city) => (
                              <Badge key={city.city} variant="secondary" className="text-xs">
                                {city.city} ({city.count})
                              </Badge>
                            ))}
                            {cityBreakdown.length > 4 && (
                              <Badge variant="secondary" className="text-xs">
                                +{cityBreakdown.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meta-clusters" className="space-y-6">
          {/* Meta Clusters Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-effect border-0 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg dashboard-gradient">
                    <PieChart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metaClusterStats.length}</p>
                    <p className="text-sm text-muted-foreground">Meta Categories</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-0 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg success-gradient">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {metaClusterStats[0]?.llmClusters.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Subclusters in Top</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-0 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg warning-gradient">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {metaClusterStats[0]?.percentage.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Largest Category</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Meta Clusters List */}
          <Card className="glass-effect border-0 shadow-card">
            <CardHeader>
              <CardTitle>Category Overview</CardTitle>
              <CardDescription>High-level categorization of all review clusters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {metaClusterStats.map((stat, index) => (
                  <Card key={stat.meta} className="p-4 border border-border/50 hover:shadow-lg transition-all duration-300">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{stat.meta}</h4>
                        <Badge 
                          variant="outline"
                          style={{ 
                            backgroundColor: `hsl(var(--chart-${(index % 6) + 1}) / 0.1)`,
                            borderColor: `hsl(var(--chart-${(index % 6) + 1}) / 0.3)`
                          }}
                        >
                          {stat.percentage.toFixed(1)}%
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Reviews:</span>
                          <span className="ml-2 font-medium">{stat.count.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cities:</span>
                          <span className="ml-2 font-medium">{stat.cities.length}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Subclusters:</span>
                          <span className="ml-2 font-medium">{stat.llmClusters.length}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg/City:</span>
                          <span className="ml-2 font-medium">{(stat.count / stat.cities.length).toFixed(1)}</span>
                        </div>
                      </div>

                      <Progress value={stat.percentage} className="h-2" />

                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Top Cities:</p>
                        <div className="flex flex-wrap gap-1">
                          {stat.cities.slice(0, 3).map((city) => (
                            <Badge key={city} variant="secondary" className="text-xs">
                              {city}
                            </Badge>
                          ))}
                          {stat.cities.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{stat.cities.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};