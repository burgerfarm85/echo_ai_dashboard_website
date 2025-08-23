import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Treemap } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { ReviewData } from '../QSRDashboard';
import { PieChart as PieChartIcon, TrendingUp, BarChart3, Filter, X, Target } from 'lucide-react';

interface ClustersAnalysisProps {
  data: ReviewData[];
  summaryStats: any;
}

type PeriodType = 'daily' | 'weekly' | 'monthly';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#d084d0'];

export const ClustersAnalysis: React.FC<ClustersAnalysisProps> = ({ data, summaryStats }) => {
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedAreaManager, setSelectedAreaManager] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedAggregator, setSelectedAggregator] = useState<string>('all');

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

  // Process data based on filters
  const processedData = useMemo(() => {
    return data
      .map(item => ({
        ...item,
        parsedDate: (() => {
          const [day, month, year] = item.Date?.split('/') || [];
          if (!day || !month || !year) return null;
          const fullYear = year.length === 2 ? (parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year)) : parseInt(year);
          return new Date(fullYear, parseInt(month) - 1, parseInt(day));
        })(),
        financialYear: (() => {
          const [day, month, year] = item.Date?.split('/') || [];
          if (!day || !month || !year) return '';
          const fullYear = year.length === 2 ? (parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year)) : parseInt(year);
          const monthNum = parseInt(month);
          return monthNum >= 4 ? `FY${fullYear}-${(fullYear + 1).toString().slice(-2)}` : `FY${fullYear - 1}-${fullYear.toString().slice(-2)}`;
        })()
      }))
      .filter(item => {
        if (!item.parsedDate) return false;
        if (selectedRegion !== 'all' && item.Region !== selectedRegion) return false;
        if (selectedAreaManager !== 'all' && item['Area Manger Name'] !== selectedAreaManager) return false;
        if (selectedStore !== 'all' && item['Store Name'] !== selectedStore) return false;
        if (selectedAggregator !== 'all' && item.Aggregator !== selectedAggregator) return false;
        return true;
      });
  }, [data, selectedRegion, selectedAreaManager, selectedStore, selectedAggregator]);

  // Meta clusters distribution
  const metaClustersData = useMemo(() => {
    const clusterCounts = processedData.reduce((acc, item) => {
      const cluster = item.LLM_Meta_Label || 'Unknown';
      acc[cluster] = (acc[cluster] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(clusterCounts)
      .map(([cluster, count]) => ({ cluster, count }))
      .sort((a, b) => b.count - a.count);
  }, [processedData]);

  // LLM clusters distribution
  const llmClustersData = useMemo(() => {
    const clusterCounts = processedData.reduce((acc, item) => {
      const cluster = item.LLM_Cluster_Label || 'Unknown';
      acc[cluster] = (acc[cluster] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(clusterCounts)
      .map(([cluster, count]) => ({ cluster, count }))
      .sort((a, b) => b.count - a.count);
  }, [processedData]);

  // Cluster trends over time
  const clusterTrendsData = useMemo(() => {
    if (!processedData.length) return [];

    const trends = processedData.reduce((acc, item) => {
      let timeKey = '';
      const date = item.parsedDate!;
      
      switch (period) {
        case 'daily':
          timeKey = date.toDateString();
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          timeKey = `Week of ${weekStart.toDateString()}`;
          break;
        case 'monthly':
          timeKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
          break;
      }

      if (!acc[timeKey]) {
        acc[timeKey] = {};
      }
      
      const cluster = item.LLM_Meta_Label || 'Unknown';
      acc[timeKey][cluster] = (acc[timeKey][cluster] || 0) + 1;
      
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return Object.entries(trends)
      .map(([period, clusters]) => ({
        period,
        ...clusters,
        total: Object.values(clusters).reduce((sum, count) => sum + count, 0)
      }))
      .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime())
      .slice(-12); // Last 12 periods
  }, [processedData, period]);

  // Cluster hierarchy data for treemap
  const hierarchyData = useMemo(() => {
    const hierarchy = processedData.reduce((acc, item) => {
      const llmCluster = item.LLM_Cluster_Label || 'Unknown';
      const metaCluster = item.LLM_Meta_Label || 'Unknown';
      
      if (!acc[llmCluster]) {
        acc[llmCluster] = {};
      }
      acc[llmCluster][metaCluster] = (acc[llmCluster][metaCluster] || 0) + 1;
      
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return Object.entries(hierarchy).map(([llmCluster, metaClusters]) => ({
      name: llmCluster,
      size: Object.values(metaClusters).reduce((sum, count) => sum + count, 0),
      children: Object.entries(metaClusters).map(([metaCluster, count]) => ({
        name: metaCluster,
        size: count
      }))
    }));
  }, [processedData]);

  const clearAllFilters = () => {
    setSelectedRegion('all');
    setSelectedAreaManager('all');
    setSelectedStore('all');
    setSelectedAggregator('all');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="glass-effect border-0 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Cluster Analysis Filters
          </CardTitle>
          <Button variant="outline" size="sm" onClick={clearAllFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Period</label>
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

            <div>
              <label className="text-sm font-medium mb-2 block">Region</label>
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

            <div>
              <label className="text-sm font-medium mb-2 block">Area Manager</label>
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

            <div>
              <label className="text-sm font-medium mb-2 block">Store</label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {filterOptions.stores.map(store => (
                    <SelectItem key={store} value={store}>{store}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Aggregator</label>
              <Select value={selectedAggregator} onValueChange={setSelectedAggregator}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Aggregators</SelectItem>
                  {filterOptions.aggregators.map(aggregator => (
                    <SelectItem key={aggregator} value={aggregator}>{aggregator}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {selectedRegion !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Region: {selectedRegion}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedRegion('all')} />
              </Badge>
            )}
            {selectedAreaManager !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Manager: {selectedAreaManager}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedAreaManager('all')} />
              </Badge>
            )}
            {selectedStore !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Store: {selectedStore}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedStore('all')} />
              </Badge>
            )}
            {selectedAggregator !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Platform: {selectedAggregator}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedAggregator('all')} />
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-effect border-0 shadow-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{processedData.length}</div>
            <p className="text-xs text-muted-foreground">Total Complaints</p>
          </CardContent>
        </Card>
        <Card className="glass-effect border-0 shadow-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{metaClustersData.length}</div>
            <p className="text-xs text-muted-foreground">Meta Clusters</p>
          </CardContent>
        </Card>
        <Card className="glass-effect border-0 shadow-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{llmClustersData.length}</div>
            <p className="text-xs text-muted-foreground">LLM Clusters</p>
          </CardContent>
        </Card>
        <Card className="glass-effect border-0 shadow-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{metaClustersData[0]?.cluster || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Top Meta Cluster</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meta Clusters Distribution */}
        <Card className="glass-effect border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Meta Clusters Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metaClustersData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ cluster, percent }) => `${cluster}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {metaClustersData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* LLM Clusters Distribution */}
        <Card className="glass-effect border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              LLM Clusters Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={llmClustersData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cluster" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cluster Trends */}
      <Card className="glass-effect border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Meta Clusters Trend Over Time ({period})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={clusterTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                {metaClustersData.slice(0, 5).map((cluster, index) => (
                  <Line
                    key={cluster.cluster}
                    type="monotone"
                    dataKey={cluster.cluster}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Cluster Hierarchy */}
      <Card className="glass-effect border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Cluster Hierarchy (LLM → Meta)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={hierarchyData}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#fff"
                fill="#8884d8"
              />
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};