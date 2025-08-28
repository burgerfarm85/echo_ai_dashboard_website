import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { ReviewData } from '../QSRDashboard';
import { MapPin, TrendingUp, BarChart3, Filter, X } from 'lucide-react';

interface RegionsAnalysisProps {
  data: ReviewData[];
  summaryStats: any;
}

type PeriodType = 'daily' | 'weekly' | 'monthly';
type ViewType = 'meta-clusters' | 'subject';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#d084d0'];

export const RegionsAnalysis: React.FC<RegionsAnalysisProps> = ({ data, summaryStats }) => {
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedAreaManager, setSelectedAreaManager] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedAggregator, setSelectedAggregator] = useState<string>('all');
  const [viewType, setViewType] = useState<ViewType>('meta-clusters');

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

  // Regional distribution data
  const regionalData = useMemo(() => {
    const regionCounts = processedData.reduce((acc, item) => {
      const region = item.Region || 'Unknown';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(regionCounts)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);
  }, [processedData]);

  // Store performance by region
  const storePerformanceData = useMemo(() => {
    const storeData = processedData.reduce((acc, item) => {
      const key = `${item.Region}-${item['Store Name']}`;
      if (!acc[key]) {
        acc[key] = {
          region: item.Region,
          store: item['Store Name'],
          complaints: 0
        };
      }
      acc[key].complaints += 1;
      return acc;
    }, {} as Record<string, { region: string; store: string; complaints: number }>);

    return Object.values(storeData).sort((a, b) => b.complaints - a.complaints);
  }, [processedData]);

  // Time series data for selected region
  const timeSeriesData = useMemo(() => {
    if (!processedData.length) return [];

    const grouped = processedData.reduce((acc, item) => {
      let key = '';
      const date = item.parsedDate!;
      
      switch (period) {
        case 'daily':
          key = date.toDateString();
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `Week of ${weekStart.toDateString()}`;
          break;
        case 'monthly':
          key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
          break;
      }

      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([period, complaints]) => ({ period, complaints }))
      .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime())
      .slice(-20); // Last 20 periods
  }, [processedData, period]);

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
            Regional Analysis Filters
          </CardTitle>
          <Button variant="outline" size="sm" onClick={clearAllFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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

            <div>
              <label className="text-sm font-medium mb-2 block">View By</label>
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
            <div className="text-2xl font-bold">{regionalData.length}</div>
            <p className="text-xs text-muted-foreground">Active Regions</p>
          </CardContent>
        </Card>
        <Card className="glass-effect border-0 shadow-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{[...new Set(processedData.map(d => d['Store Name']))].length}</div>
            <p className="text-xs text-muted-foreground">Stores</p>
          </CardContent>
        </Card>
        <Card className="glass-effect border-0 shadow-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{[...new Set(processedData.map(d => d.LLM_Meta_Label))].length}</div>
            <p className="text-xs text-muted-foreground">Meta Clusters</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Distribution */}
        <Card className="glass-effect border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Regional Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Time Series */}
        <Card className="glass-effect border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Complaints Trend ({period})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="complaints" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Store Performance */}
      <Card className="glass-effect border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Critical Stores by Complaints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storePerformanceData.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="store" angle={-45} textAnchor="end" height={120} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="complaints" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};