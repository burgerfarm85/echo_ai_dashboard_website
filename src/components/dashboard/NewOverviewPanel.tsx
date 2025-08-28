import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { TrendingUp, TrendingDown, BarChart3, Filter, Calendar, MapPin, User, Store } from 'lucide-react';
import { format, parse, startOfWeek, startOfMonth, isAfter, isBefore, addDays, addWeeks, addMonths } from 'date-fns';

interface ReviewData {
  'S.No': number;
  'Store Name': string;
  'Region': string;
  'Date': string;
  'Remark': string;
  'Subject': string;
  'Aggregator': string;
  'Month': string;
  'Area Manger Name': string;
  'LLM_Cluster_Label': string;
  'LLM_Meta_Label': string;
}

interface NewOverviewPanelProps {
  data: ReviewData[];
  summaryStats: any;
}

type PeriodType = 'daily' | 'weekly' | 'monthly';
type ViewType = 'meta-clusters' | 'subject';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))'
];

export const NewOverviewPanel: React.FC<NewOverviewPanelProps> = ({ data, summaryStats }) => {
  // Filter and sort states
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedAreaManager, setSelectedAreaManager] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedAggregator, setSelectedAggregator] = useState<string>('all');
  const [viewType, setViewType] = useState<ViewType>('meta-clusters');
  const [expandedMetaClusters, setExpandedMetaClusters] = useState<Set<string>>(new Set());

  // Extract unique values for filters
  // Cascading filter options - only show options that have data for current selection
  const filterOptions = useMemo(() => {
    // Apply currently selected filters to get base filtered data
    let filteredData = data.filter(item => {
      if (selectedRegion !== 'all' && item.Region !== selectedRegion) return false;
      if (selectedAreaManager !== 'all' && item['Area Manger Name'] !== selectedAreaManager) return false;
      if (selectedStore !== 'all' && item['Store Name'] !== selectedStore) return false;
      if (selectedAggregator !== 'all' && item.Aggregator !== selectedAggregator) return false;
      return true;
    });

    // Extract available options from filtered data
    const regions = [...new Set(data.map(d => d.Region))].filter(Boolean).sort();
    const areaManagers = [...new Set(filteredData.filter(d => selectedRegion === 'all' || d.Region === selectedRegion).map(d => d['Area Manger Name']))].filter(Boolean).sort();
    const stores = [...new Set(filteredData.filter(d => 
      (selectedRegion === 'all' || d.Region === selectedRegion) &&
      (selectedAreaManager === 'all' || d['Area Manger Name'] === selectedAreaManager)
    ).map(d => d['Store Name']))].filter(Boolean).sort();
    const aggregators = [...new Set(filteredData.filter(d =>
      (selectedRegion === 'all' || d.Region === selectedRegion) &&
      (selectedAreaManager === 'all' || d['Area Manger Name'] === selectedAreaManager) &&
      (selectedStore === 'all' || d['Store Name'] === selectedStore)
    ).map(d => d.Aggregator))].filter(Boolean).sort();

    return { regions, areaManagers, stores, aggregators };
  }, [data, selectedRegion, selectedAreaManager, selectedStore, selectedAggregator]);

  // Parse and filter data based on financial year (April 1st start)
  const processedData = useMemo(() => {
    return data.map(item => {
      const [day, month, year] = item.Date.split('/').map(Number);
      const fullYear = year < 50 ? 2000 + year : 1900 + year; // Handle 2-digit years
      const dateObj = new Date(fullYear, month - 1, day);
      
      // Financial year calculation (starts April 1st)
      const financialYear = month >= 4 ? fullYear : fullYear - 1;
      
      return {
        ...item,
        dateObj,
        financialYear,
        weekStart: startOfWeek(dateObj),
        monthStart: startOfMonth(dateObj)
      };
    }).filter(item => {
      if (selectedRegion !== 'all' && item.Region !== selectedRegion) return false;
      if (selectedAreaManager !== 'all' && item['Area Manger Name'] !== selectedAreaManager) return false;
      if (selectedStore !== 'all' && item['Store Name'] !== selectedStore) return false;
      if (selectedAggregator !== 'all' && item.Aggregator !== selectedAggregator) return false;
      return true;
    });
  }, [data, selectedRegion, selectedAreaManager, selectedStore, selectedAggregator]);

  // Generate time series data for line chart
  const timeSeriesData = useMemo(() => {
    const groupedData = new Map();
    
    processedData.forEach(item => {
      let key: string;
      if (period === 'daily') {
        key = format(item.dateObj, 'dd/MM/yy');
      } else if (period === 'weekly') {
        key = format(item.weekStart, 'dd/MM/yy');
      } else {
        key = format(item.monthStart, 'MMM yyyy');
      }
      
      if (!groupedData.has(key)) {
        groupedData.set(key, { period: key, complaints: 0, date: item.dateObj });
      }
      groupedData.get(key).complaints += 1;
    });

    return Array.from(groupedData.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(({ period, complaints }) => ({ period, complaints }));
  }, [processedData, period]);

  // Individual pie charts for each meta cluster
  const metaClusterPieCharts = useMemo(() => {
    const metaClusters = [...new Set(processedData.map(d => d.LLM_Meta_Label))].filter(Boolean).sort();
    
    return metaClusters.map(metaCluster => {
      const clusterData = processedData.filter(d => d.LLM_Meta_Label === metaCluster);
      
      // Count by subject within this meta cluster
      const subjectCounts = clusterData.reduce((acc, item) => {
        const subject = item.Subject || 'Unknown';
        acc[subject] = (acc[subject] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const pieData = Object.entries(subjectCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      return {
        metaCluster,
        data: pieData,
        total: clusterData.length
      };
    });
  }, [processedData]);

  // Calculate pie chart data based on view type
  const pieChartData = useMemo(() => {
    const counts = new Map();
    const field = viewType === 'meta-clusters' ? 'LLM_Meta_Label' : 'Subject';
    
    processedData.forEach(item => {
      const value = item[field];
      counts.set(value, (counts.get(value) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8
  }, [processedData, viewType]);

  // Calculate trend analysis for key insights
  const trendAnalysis = useMemo(() => {
    if (timeSeriesData.length < 2) return { increasing: [], decreasing: [] };

    const midPoint = Math.floor(timeSeriesData.length / 2);
    const firstHalf = timeSeriesData.slice(0, midPoint);
    const secondHalf = timeSeriesData.slice(midPoint);

    const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.complaints, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.complaints, 0) / secondHalf.length;

    // Analyze meta clusters trends  
    const metaClusters = [...new Set(processedData.map(d => d.LLM_Meta_Label))];
    const midPointDate = timeSeriesData[midPoint - 1] ? processedData[Math.floor(processedData.length / 2)]?.dateObj : new Date();
    const trends = metaClusters.map(cluster => {
      const clusterData = processedData.filter(d => d.LLM_Meta_Label === cluster);
      const firstHalfCount = clusterData.filter(d => d.dateObj <= midPointDate).length;
      const secondHalfCount = clusterData.filter(d => d.dateObj > midPointDate).length;
      
      const change = secondHalfCount - firstHalfCount;
      return { cluster, change, firstHalf: firstHalfCount, secondHalf: secondHalfCount };
    });

    const increasing = trends.filter(t => t.change > 0).sort((a, b) => b.change - a.change).slice(0, 3);
    const decreasing = trends.filter(t => t.change < 0).sort((a, b) => a.change - b.change).slice(0, 3);

    return { increasing, decreasing, overallTrend: secondHalfAvg > firstHalfAvg ? 'increasing' : 'decreasing' };
  }, [timeSeriesData, processedData]);

  const clearAllFilters = () => {
    setSelectedRegion('all');
    setSelectedAreaManager('all');
    setSelectedStore('all');
    setSelectedAggregator('all');
  };

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <Card className="glass-effect border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Analysis Controls
          </CardTitle>
          <CardDescription>
            Configure filters and view options for your analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Period Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Period
              </label>
              <Select value={period} onValueChange={(value: PeriodType) => setPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Region Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Region
              </label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {filterOptions.regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Area Manager Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Area Manager
              </label>
              <Select value={selectedAreaManager} onValueChange={setSelectedAreaManager}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Managers</SelectItem>
                  {filterOptions.areaManagers.map(manager => (
                    <SelectItem key={manager} value={manager}>{manager}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Store Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Store className="h-4 w-4" />
                Store
              </label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {filterOptions.stores.slice(0, 50).map(store => (
                    <SelectItem key={store} value={store}>{store}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Aggregator Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Aggregator</label>
                <Select value={selectedAggregator} onValueChange={setSelectedAggregator}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {filterOptions.aggregators.map(aggregator => (
                      <SelectItem key={aggregator} value={aggregator}>{aggregator}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* View Type Toggle */}
              <div className="space-y-2">
                <label className="text-sm font-medium">View By</label>
                <div className="flex gap-2">
                  <Button
                    variant={viewType === 'meta-clusters' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewType('meta-clusters')}
                  >
                    Meta Clusters
                  </Button>
                  <Button
                    variant={viewType === 'subject' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewType('subject')}
                  >
                    Subject
                  </Button>
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-effect border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Complaints</p>
                <p className="text-2xl font-bold">{processedData.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-effect border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Regions Affected</p>
                <p className="text-2xl font-bold">{new Set(processedData.map(d => d.Region)).size}</p>
              </div>
              <MapPin className="h-8 w-8 text-chart-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stores Affected</p>
                <p className="text-2xl font-bold">{new Set(processedData.map(d => d['Store Name'])).size}</p>
              </div>
              <Store className="h-8 w-8 text-chart-3" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meta Clusters</p>
                <p className="text-2xl font-bold">{new Set(processedData.map(d => d.LLM_Meta_Label)).size}</p>
              </div>
              <div className="flex items-center">
                <Badge variant="secondary">{viewType === 'meta-clusters' ? 'Active' : 'View'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Chart - Complaints Over Time */}
      <Card className="glass-effect border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Complaints Trend Over Time
            <Badge variant="outline" className="ml-auto">
              {period.charAt(0).toUpperCase() + period.slice(1)} View
            </Badge>
          </CardTitle>
          <CardDescription>
            Number of complaints over the selected time period (Financial Year: April-March)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              complaints: {
                label: "Complaints",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="complaints" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(var(--chart-1))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Pie Charts */}
      <Card className="glass-effect border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-chart-2" />
            Distribution by {viewType === 'meta-clusters' ? 'Meta Clusters' : 'Subject'}
            <Badge variant="outline" className="ml-auto">
              {selectedRegion !== 'all' && `${selectedRegion} • `}
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Badge>
          </CardTitle>
          <CardDescription>
            Breakdown of complaints by {viewType === 'meta-clusters' ? 'meta clusters' : 'subject'} for selected filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Top {viewType === 'meta-clusters' ? 'Meta Clusters' : 'Subjects'}</h4>
              {pieChartData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{item.value} complaints</span>
                    <Badge variant="outline" className="text-xs">
                      {((item.value / processedData.length) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Meta Cluster Pie Charts */}
      <Card className="glass-effect border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-chart-3" />
            Subject Distribution by Meta Cluster
            <Badge variant="outline" className="ml-auto">
              {metaClusterPieCharts.length} Meta Clusters
            </Badge>
          </CardTitle>
          <CardDescription>
            Individual pie charts showing subject breakdown for each meta cluster
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metaClusterPieCharts.map((cluster, index) => (
              <div key={cluster.metaCluster} className="space-y-2">
                <div className="text-center">
                  <h4 className="font-medium text-sm">{cluster.metaCluster}</h4>
                  <p className="text-xs text-muted-foreground">{cluster.total} complaints</p>
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cluster.data}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {cluster.data.map((entry, pieIndex) => (
                          <Cell key={`cell-${pieIndex}`} fill={CHART_COLORS[pieIndex % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-lg p-2 shadow-lg">
                                <p className="font-medium">{data.name}</p>
                                <p className="text-sm text-muted-foreground">{data.value} complaints</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1">
                  {(expandedMetaClusters.has(cluster.metaCluster) ? cluster.data : cluster.data.slice(0, 3)).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                        />
                        <span className="truncate max-w-[100px]">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{item.value}</span>
                        <span className="text-xs text-muted-foreground">
                          ({((item.value / cluster.total) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  {cluster.data.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-full text-xs text-muted-foreground hover:text-primary"
                      onClick={() => {
                        const newExpanded = new Set(expandedMetaClusters);
                        if (expandedMetaClusters.has(cluster.metaCluster)) {
                          newExpanded.delete(cluster.metaCluster);
                        } else {
                          newExpanded.add(cluster.metaCluster);
                        }
                        setExpandedMetaClusters(newExpanded);
                      }}
                    >
                      {expandedMetaClusters.has(cluster.metaCluster) 
                        ? "Show less" 
                        : `+${cluster.data.length - 3} more`
                      }
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="glass-effect border-0 shadow-card">
        <CardHeader>
          <CardTitle>📊 Key Insights</CardTitle>
          <CardDescription>
            Trend analysis and patterns for the selected period and filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Increasing Trends */}
            <div className="space-y-4">
              <h4 className="font-semibold text-accent flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Increasing Trend Meta Clusters
              </h4>
              {trendAnalysis.increasing.length > 0 ? (
                <div className="space-y-3">
                  {trendAnalysis.increasing.map((item, index) => (
                    <div key={item.cluster} className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{item.cluster}</span>
                        <Badge variant="outline" className="text-accent border-accent/30">
                          +{item.change} complaints
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.firstHalf} → {item.secondHalf} complaints
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No significant increasing trends detected.</p>
              )}
            </div>

            {/* Decreasing Trends */}
            <div className="space-y-4">
              <h4 className="font-semibold text-chart-2 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Decreasing Trend Meta Clusters
              </h4>
              {trendAnalysis.decreasing.length > 0 ? (
                <div className="space-y-3">
                  {trendAnalysis.decreasing.map((item, index) => (
                    <div key={item.cluster} className="p-3 rounded-lg bg-chart-2/10 border border-chart-2/20">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{item.cluster}</span>
                        <Badge variant="outline" className="text-chart-2 border-chart-2/30">
                          {item.change} complaints
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.firstHalf} → {item.secondHalf} complaints
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No significant decreasing trends detected.</p>
              )}
            </div>
          </div>

          {/* Overall Trend Summary */}
          <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              {trendAnalysis.overallTrend === 'increasing' ? (
                <TrendingUp className="h-4 w-4 text-primary" />
              ) : (
                <TrendingDown className="h-4 w-4 text-primary" />
              )}
              <h4 className="font-semibold text-primary">Overall Trend</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {trendAnalysis.overallTrend === 'increasing' 
                ? 'Complaints are showing an increasing trend in the selected period.' 
                : 'Complaints are showing a decreasing trend in the selected period.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};