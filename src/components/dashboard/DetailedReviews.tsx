import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ReviewData } from '../QSRDashboard';
import { Search, Filter, X, Star, Calendar, MapPin, Building, User, Tag } from 'lucide-react';

interface DetailedReviewsProps {
  data: ReviewData[];
  summaryStats: any;
}

type PeriodType = 'daily' | 'weekly' | 'monthly';
type SortField = 'date' | 'region' | 'store' | 'meta-cluster' | 'subject';
type SortOrder = 'asc' | 'desc';

export const DetailedReviews: React.FC<DetailedReviewsProps> = ({ data, summaryStats }) => {
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedAreaManager, setSelectedAreaManager] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedAggregator, setSelectedAggregator] = useState<string>('all');
  const [selectedMetaCluster, setSelectedMetaCluster] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Cascading filter options - only show options that have data for current selection
  const filterOptions = useMemo(() => {
    // Apply currently selected filters to get base filtered data
    let filteredData = data.filter(item => {
      if (selectedRegion !== 'all' && item.Region !== selectedRegion) return false;
      if (selectedAreaManager !== 'all' && item['Area Manger Name'] !== selectedAreaManager) return false;
      if (selectedStore !== 'all' && item['Store Name'] !== selectedStore) return false;
      if (selectedAggregator !== 'all' && item.Aggregator !== selectedAggregator) return false;
      if (selectedMetaCluster !== 'all' && item.LLM_Meta_Label !== selectedMetaCluster) return false;
      if (selectedSubject !== 'all' && item.Subject !== selectedSubject) return false;
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
    const metaClusters = [...new Set(filteredData.filter(d =>
      (selectedRegion === 'all' || d.Region === selectedRegion) &&
      (selectedAreaManager === 'all' || d['Area Manger Name'] === selectedAreaManager) &&
      (selectedStore === 'all' || d['Store Name'] === selectedStore) &&
      (selectedAggregator === 'all' || d.Aggregator === selectedAggregator)
    ).map(d => d.LLM_Meta_Label))].filter(Boolean).sort();
    const subjects = [...new Set(filteredData.filter(d =>
      (selectedRegion === 'all' || d.Region === selectedRegion) &&
      (selectedAreaManager === 'all' || d['Area Manger Name'] === selectedAreaManager) &&
      (selectedStore === 'all' || d['Store Name'] === selectedStore) &&
      (selectedAggregator === 'all' || d.Aggregator === selectedAggregator) &&
      (selectedMetaCluster === 'all' || d.LLM_Meta_Label === selectedMetaCluster)
    ).map(d => d.Subject))].filter(Boolean).sort();

    return { regions, areaManagers, stores, aggregators, metaClusters, subjects };
  }, [data, selectedRegion, selectedAreaManager, selectedStore, selectedAggregator, selectedMetaCluster, selectedSubject]);

  // Process and filter data
  const processedData = useMemo(() => {
    let filtered = data
      .map(item => ({
        ...item,
        parsedDate: (() => {
          const [day, month, year] = item.Date?.split('/') || [];
          if (!day || !month || !year) return null;
          const fullYear = year.length === 2 ? (parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year)) : parseInt(year);
          return new Date(fullYear, parseInt(month) - 1, parseInt(day));
        })()
      }))
      .filter(item => {
        if (!item.parsedDate) return false;
        if (selectedRegion !== 'all' && item.Region !== selectedRegion) return false;
        if (selectedAreaManager !== 'all' && item['Area Manger Name'] !== selectedAreaManager) return false;
        if (selectedStore !== 'all' && item['Store Name'] !== selectedStore) return false;
        if (selectedAggregator !== 'all' && item.Aggregator !== selectedAggregator) return false;
        if (selectedMetaCluster !== 'all' && item.LLM_Meta_Label !== selectedMetaCluster) return false;
        if (selectedSubject !== 'all' && item.Subject !== selectedSubject) return false;
        if (searchTerm && !item.Remark?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      });

    // Sort data
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case 'date':
          aVal = a.parsedDate?.getTime() || 0;
          bVal = b.parsedDate?.getTime() || 0;
          break;
        case 'region':
          aVal = a.Region || '';
          bVal = b.Region || '';
          break;
        case 'store':
          aVal = a['Store Name'] || '';
          bVal = b['Store Name'] || '';
          break;
        case 'meta-cluster':
          aVal = a.LLM_Meta_Label || '';
          bVal = b.LLM_Meta_Label || '';
          break;
        case 'subject':
          aVal = a.Subject || '';
          bVal = b.Subject || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [data, selectedRegion, selectedAreaManager, selectedStore, selectedAggregator, selectedMetaCluster, selectedSubject, searchTerm, sortField, sortOrder]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return processedData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(processedData.length / rowsPerPage);

  const clearAllFilters = () => {
    setSelectedRegion('all');
    setSelectedAreaManager('all');
    setSelectedStore('all');
    setSelectedAggregator('all');
    setSelectedMetaCluster('all');
    setSelectedSubject('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="glass-effect border-0 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Review Filters
          </CardTitle>
          <Button variant="outline" size="sm" onClick={clearAllFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear All
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search in reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
              <label className="text-sm font-medium mb-2 block">Meta Cluster</label>
              <Select value={selectedMetaCluster} onValueChange={setSelectedMetaCluster}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Meta Clusters</SelectItem>
                  {filterOptions.metaClusters.map(cluster => (
                    <SelectItem key={cluster} value={cluster}>{cluster}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {filterOptions.subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
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
            {selectedMetaCluster !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Meta Cluster: {selectedMetaCluster}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedMetaCluster('all')} />
              </Badge>
            )}
            {selectedSubject !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Subject: {selectedSubject}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedSubject('all')} />
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Search: "{searchTerm}"
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm('')} />
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="glass-effect border-0 shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {paginatedData.length} of {processedData.length} reviews
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span>Rows per page:</span>
                <Select value={rowsPerPage.toString()} onValueChange={(value) => {
                  setRowsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card className="glass-effect border-0 shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('date')}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Date
                      {sortField === 'date' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('region')}
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      Region
                      {sortField === 'region' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('store')}
                    >
                      <Building className="h-4 w-4 mr-1" />
                      Store
                      {sortField === 'store' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <User className="h-4 w-4 mr-1 inline" />
                    Area Manager
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('subject')}
                    >
                      <Tag className="h-4 w-4 mr-1" />
                      Subject
                      {sortField === 'subject' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('meta-cluster')}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Meta Cluster
                      {sortField === 'meta-cluster' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </Button>
                  </TableHead>
                  <TableHead>Aggregator</TableHead>
                  <TableHead className="min-w-[300px]">Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((review, index) => (
                  <TableRow key={`${review['S.No']}-${index}`}>
                    <TableCell className="font-mono text-xs">
                      {review.Date}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{review.Region}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {review['Store Name']}
                    </TableCell>
                    <TableCell className="text-sm">
                      {review['Area Manger Name']}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {review.Subject}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="text-xs">
                        {review.LLM_Meta_Label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {review.Aggregator}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="text-sm line-clamp-3">
                        {review.Remark}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <Card className="glass-effect border-0 shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};