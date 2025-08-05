import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { ReviewData } from '../QSRDashboard';

interface OverviewPanelProps {
  data: ReviewData[];
  summaryStats: any;
}

export const OverviewPanel: React.FC<OverviewPanelProps> = ({ data, summaryStats }) => {
  // Calculate city performance metrics
  const cityMetrics = React.useMemo(() => {
    const cityGroups = data.reduce((acc, review) => {
      if (!acc[review.City]) {
        acc[review.City] = [];
      }
      acc[review.City].push(review);
      return acc;
    }, {} as Record<string, ReviewData[]>);

    return Object.entries(cityGroups).map(([city, reviews]) => {
      const totalReviews = reviews.length;
      const clusters = [...new Set(reviews.map(r => r.LLM_Cluster_Label))];
      const metaClusters = [...new Set(reviews.map(r => r.LLM_Meta_Label))];
      
      // Calculate problematic reviews (containing keywords like "missing", "wrong", "poor", etc.)
      const problematicKeywords = ['missing', 'wrong', 'poor', 'bad', 'terrible', 'awful', 'disappointed', 'error'];
      const problematicReviews = reviews.filter(r => 
        problematicKeywords.some(keyword => 
          r.Reviews.toLowerCase().includes(keyword) || 
          r.LLM_Cluster_Label.toLowerCase().includes(keyword)
        )
      );
      
      const issueRate = (problematicReviews.length / totalReviews) * 100;
      
      return {
        city,
        totalReviews,
        clusters: clusters.length,
        metaClusters: metaClusters.length,
        issueRate,
        status: issueRate < 20 ? 'good' : issueRate < 40 ? 'warning' : 'critical'
      };
    }).sort((a, b) => b.totalReviews - a.totalReviews);
  }, [data]);

  // Calculate most common issues
  const topIssues = React.useMemo(() => {
    const clusterCounts = data.reduce((acc, review) => {
      acc[review.LLM_Cluster_Label] = (acc[review.LLM_Cluster_Label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(clusterCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([cluster, count]) => ({
        cluster,
        count,
        percentage: (count / data.length) * 100
      }));
  }, [data]);

  // Calculate meta cluster distribution
  const metaClusterDistribution = React.useMemo(() => {
    const metaCounts = data.reduce((acc, review) => {
      acc[review.LLM_Meta_Label] = (acc[review.LLM_Meta_Label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(metaCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([meta, count]) => ({
        meta,
        count,
        percentage: (count / data.length) * 100
      }));
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Top Performing Cities */}
      <Card className="glass-effect border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            City Performance Overview
          </CardTitle>
          <CardDescription>
            Performance metrics across all locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cityMetrics.slice(0, 6).map((city) => (
              <Card key={city.city} className="p-4 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{city.city}</h4>
                  <Badge 
                    variant={city.status === 'good' ? 'default' : city.status === 'warning' ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {city.status === 'good' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {city.status === 'warning' && <AlertCircle className="h-3 w-3 mr-1" />}
                    {city.status === 'critical' && <TrendingDown className="h-3 w-3 mr-1" />}
                    {city.status.charAt(0).toUpperCase() + city.status.slice(1)}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reviews:</span>
                    <span className="font-medium">{city.totalReviews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issue Rate:</span>
                    <span className={`font-medium ${city.issueRate < 20 ? 'text-accent' : city.issueRate < 40 ? 'text-warning' : 'text-destructive'}`}>
                      {city.issueRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clusters:</span>
                    <span className="font-medium">{city.clusters}</span>
                  </div>
                </div>
                <Progress value={100 - city.issueRate} className="mt-3" />
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Issues */}
        <Card className="glass-effect border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Most Common Issues
            </CardTitle>
            <CardDescription>
              Top recurring problems across all locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topIssues.map((issue, index) => (
                <div key={issue.cluster} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate flex-1 mr-2">
                      {issue.cluster}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {issue.count} reviews
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {issue.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={issue.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Meta Cluster Distribution */}
        <Card className="glass-effect border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-accent" />
              Review Categories
            </CardTitle>
            <CardDescription>
              Distribution across meta clusters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metaClusterDistribution.map((meta, index) => (
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
                    style={{
                      backgroundColor: `hsl(var(--chart-${(index % 6) + 1}) / 0.2)`
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card className="glass-effect border-0 shadow-card">
        <CardHeader>
          <CardTitle>📊 Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <h4 className="font-semibold text-accent mb-2">Most Reviewed City</h4>
              <p className="text-sm text-muted-foreground">
                {cityMetrics[0]?.city} with {cityMetrics[0]?.issueRate.toFixed(1)}% reviews
              </p>
            </div>
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <h4 className="font-semibold text-warning mb-2">Most Common Issue</h4>
              <p className="text-sm text-muted-foreground">
                {topIssues[0]?.cluster} ({topIssues[0]?.percentage.toFixed(1)}% of reviews)
              </p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">Largest Category</h4>
              <p className="text-sm text-muted-foreground">
                {metaClusterDistribution[0]?.meta} ({metaClusterDistribution[0]?.percentage.toFixed(1)}% of reviews)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};