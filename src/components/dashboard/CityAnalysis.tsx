import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { MapPin, BarChart3, PieChart, AlertTriangle, TrendingUp } from 'lucide-react';
import { ReviewData } from '../QSRDashboard';

interface CityAnalysisProps {
  data: ReviewData[];
}

export const CityAnalysis: React.FC<CityAnalysisProps> = ({ data }) => {
  const [selectedCity, setSelectedCity] = useState<string>('all');

  // Calculate city statistics
  const cityStats = React.useMemo(() => {
    const cityGroups = data.reduce((acc, review) => {
      if (!acc[review.City]) {
        acc[review.City] = [];
      }
      acc[review.City].push(review);
      return acc;
    }, {} as Record<string, ReviewData[]>);

    return Object.entries(cityGroups).map(([city, reviews]) => {
      const totalReviews = reviews.length;
      
      // Calculate cluster distribution
      const clusterCounts = reviews.reduce((acc, review) => {
        acc[review.LLM_Cluster_Label] = (acc[review.LLM_Cluster_Label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topClusters = Object.entries(clusterCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([cluster, count]) => ({
          cluster,
          count,
          percentage: (count / totalReviews) * 100
        }));

      // Calculate meta cluster distribution
      const metaCounts = reviews.reduce((acc, review) => {
        acc[review.LLM_Meta_Label] = (acc[review.LLM_Meta_Label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const metaDistribution = Object.entries(metaCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([meta, count]) => ({
          meta,
          count,
          percentage: (count / totalReviews) * 100
        }));

      // Calculate issue metrics
      const problematicKeywords = ['missing', 'wrong', 'poor', 'bad', 'terrible', 'awful', 'disappointed', 'error', 'not received', 'damaged'];
      const issueReviews = reviews.filter(r => 
        problematicKeywords.some(keyword => 
          r.Reviews.toLowerCase().includes(keyword) || 
          r.LLM_Cluster_Label.toLowerCase().includes(keyword)
        )
      );

      const issueRate = (issueReviews.length / totalReviews) * 100;
      const satisfactionRate = 100 - issueRate;

      return {
        city,
        totalReviews,
        topClusters,
        metaDistribution,
        issueRate,
        satisfactionRate,
        uniqueClusters: Object.keys(clusterCounts).length,
        uniqueMetaClusters: Object.keys(metaCounts).length
      };
    }).sort((a, b) => b.totalReviews - a.totalReviews);
  }, [data]);

  const cities = ['all', ...cityStats.map(stat => stat.city)];
  const filteredStats = selectedCity === 'all' ? cityStats : cityStats.filter(stat => stat.city === selectedCity);

  // Calculate comparison metrics when "all" is selected
  const comparisonMetrics = React.useMemo(() => {
    if (selectedCity !== 'all') return null;

    const avgSatisfaction = cityStats.reduce((sum, stat) => sum + stat.satisfactionRate, 0) / cityStats.length;
    const bestCity = cityStats.reduce((best, stat) => stat.satisfactionRate > best.satisfactionRate ? stat : best);
    const worstCity = cityStats.reduce((worst, stat) => stat.satisfactionRate < worst.satisfactionRate ? stat : worst);
    
    return {
      avgSatisfaction,
      bestCity,
      worstCity,
      totalCities: cityStats.length
    };
  }, [cityStats, selectedCity]);

  return (
    <div className="space-y-6">
      {/* City Selector */}
      <Card className="glass-effect border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            City Analysis
          </CardTitle>
          <CardDescription>
            Deep dive into performance metrics by location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Select City:</label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choose a city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities (Comparison)</SelectItem>
                {cityStats.map(stat => (
                  <SelectItem key={stat.city} value={stat.city}>
                    {stat.city} ({stat.totalReviews} reviews)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedCity === 'all' ? (
        <>
          {/* Comparison Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-effect border-0 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg success-gradient">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{comparisonMetrics?.avgSatisfaction.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-0 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg dashboard-gradient">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{comparisonMetrics?.bestCity.city}</p>
                    <p className="text-sm text-muted-foreground">Best Performing</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-0 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg warning-gradient">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{comparisonMetrics?.worstCity.city}</p>
                    <p className="text-sm text-muted-foreground">Needs Attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-0 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg danger-gradient">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{comparisonMetrics?.totalCities}</p>
                    <p className="text-sm text-muted-foreground">Total Cities</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* City Comparison Grid */}
          <Card className="glass-effect border-0 shadow-card">
            <CardHeader>
              <CardTitle>City Performance Comparison</CardTitle>
              <CardDescription>Compare satisfaction rates and review volumes across all locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStats.map((stat) => (
                  <Card key={stat.city} className="p-4 border border-border/50 hover:shadow-lg transition-all duration-300">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">{stat.city}</h4>
                        <Badge 
                          variant={stat.satisfactionRate >= 80 ? 'default' : stat.satisfactionRate >= 60 ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {stat.satisfactionRate.toFixed(1)}% Disappointment Level
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reviews:</span>
                          <span className="font-medium">{stat.totalReviews.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Issue Rate:</span>
                          <span className={`font-medium ${stat.issueRate < 20 ? 'text-accent' : stat.issueRate < 40 ? 'text-warning' : 'text-destructive'}`}>
                            {stat.issueRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Issue Types:</span>
                          <span className="font-medium">{stat.uniqueClusters}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Satisfaction Rate</span>
                          <span>{stat.satisfactionRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={stat.satisfactionRate} className="h-2" />
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Top Issues:</p>
                        <div className="flex flex-wrap gap-1">
                          {stat.topClusters.slice(0, 2).map((cluster, idx) => (
                            <Badge key={cluster.cluster} variant="outline" className="text-xs">
                              {cluster.cluster.length > 20 ? cluster.cluster.substring(0, 20) + '...' : cluster.cluster}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        // Single City Analysis
        filteredStats.map((stat) => (
          <div key={stat.city} className="space-y-6">
            {/* City Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-effect border-0 shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg dashboard-gradient">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.totalReviews.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Total Reviews</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-0 shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg success-gradient">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.satisfactionRate.toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-0 shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg warning-gradient">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.uniqueClusters}</p>
                      <p className="text-sm text-muted-foreground">Issue Types</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-0 shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg danger-gradient">
                      <PieChart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.uniqueMetaClusters}</p>
                      <p className="text-sm text-muted-foreground">Categories</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Issues for City */}
              <Card className="glass-effect border-0 shadow-card">
                <CardHeader>
                  <CardTitle>Top Issues in {stat.city}</CardTitle>
                  <CardDescription>Most frequent problems reported</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stat.topClusters.map((cluster, index) => (
                      <div key={cluster.cluster} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate flex-1 mr-2">
                            {cluster.cluster}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {cluster.count} reviews
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {cluster.percentage.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                        <Progress value={cluster.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Meta Cluster Distribution for City */}
              <Card className="glass-effect border-0 shadow-card">
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                  <CardDescription>Review distribution by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stat.metaDistribution.map((meta, index) => (
                      <div key={meta.meta} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate flex-1 mr-2">
                            {meta.meta}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {meta.count} reviews
                            </span>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ 
                                backgroundColor: `hsl(var(--chart-${(index % 6) + 1}) / 0.1)`,
                                borderColor: `hsl(var(--chart-${(index % 6) + 1}) / 0.3)`
                              }}
                            >
                              {meta.percentage.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                        <Progress 
                          value={meta.percentage} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ))
      )}
    </div>
  );

};
