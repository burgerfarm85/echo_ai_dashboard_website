import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Search, Filter, FileText, MapPin, Tag, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { ReviewData } from '../QSRDashboard';

interface DetailedReviewsProps {
  data: ReviewData[];
}

export const DetailedReviews: React.FC<DetailedReviewsProps> = ({ data }) => {
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterMetaCluster, setFilterMetaCluster] = useState<string>('all');
  const [filterLLMCluster, setFilterLLMCluster] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<ReviewData | null>(null);
  
  const itemsPerPage = 20;

  // Get unique values for filters
  const cities = ['all', ...Array.from(new Set(data.map(d => d.City).filter(city => city && city.trim() !== ''))).sort()];
  const metaClusters = ['all', ...Array.from(new Set(data.map(d => d.LLM_Meta_Label).filter(meta => meta && meta.trim() !== ''))).sort()];
  const llmClusters = ['all', ...Array.from(new Set(data.map(d => d.LLM_Cluster_Label).filter(cluster => cluster && cluster.trim() !== ''))).sort()];

  // Filter data
  const filteredData = React.useMemo(() => {
    let filtered = data;

    if (filterCity !== 'all') {
      filtered = filtered.filter(d => d.City === filterCity);
    }

    if (filterMetaCluster !== 'all') {
      filtered = filtered.filter(d => d.LLM_Meta_Label === filterMetaCluster);
    }

    if (filterLLMCluster !== 'all') {
      filtered = filtered.filter(d => d.LLM_Cluster_Label === filterLLMCluster);
    }

    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.Reviews.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.LLM_Cluster_Label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.LLM_Meta_Label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [data, filterCity, filterMetaCluster, filterLLMCluster, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterCity, filterMetaCluster, filterLLMCluster, searchTerm]);

  const clearFilters = () => {
    setFilterCity('all');
    setFilterMetaCluster('all');
    setFilterLLMCluster('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const getReviewSentiment = (review: string, cluster: string) => {
    const negativeKeywords = ['missing', 'wrong', 'poor', 'bad', 'terrible', 'awful', 'disappointed', 'error', 'not received', 'damaged', 'cold', 'late'];
    const positiveKeywords = ['good', 'great', 'excellent', 'amazing', 'perfect', 'delicious', 'fresh', 'hot', 'fast', 'friendly'];
    
    const reviewLower = review.toLowerCase();
    const clusterLower = cluster.toLowerCase();
    
    const hasNegative = negativeKeywords.some(keyword => reviewLower.includes(keyword) || clusterLower.includes(keyword));
    const hasPositive = positiveKeywords.some(keyword => reviewLower.includes(keyword) || clusterLower.includes(keyword));
    
    if (hasNegative && !hasPositive) return 'negative';
    if (hasPositive && !hasNegative) return 'positive';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="glass-effect border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Review Explorer
          </CardTitle>
          <CardDescription>
            Browse and analyze individual customer reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger>
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>
                      {city === 'all' ? 'All Cities' : city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={filterMetaCluster} onValueChange={setFilterMetaCluster}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {metaClusters.map(meta => (
                    <SelectItem key={meta} value={meta}>
                      {meta === 'all' ? 'All Categories' : meta.length > 30 ? meta.substring(0, 30) + '...' : meta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Issue Type</label>
              <Select value={filterLLMCluster} onValueChange={setFilterLLMCluster}>
                <SelectTrigger>
                  <SelectValue placeholder="All Issues" />
                </SelectTrigger>
                <SelectContent>
                  {llmClusters.map(cluster => (
                    <SelectItem key={cluster} value={cluster}>
                      {cluster === 'all' ? 'All Issues' : cluster.length > 30 ? cluster.substring(0, 30) + '...' : cluster}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {paginatedData.length} of {filteredData.length} reviews
              </p>
              {(filterCity !== 'all' || filterMetaCluster !== 'all' || filterLLMCluster !== 'all' || searchTerm) && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
                  <Filter className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {paginatedData.map((review, index) => {
          const sentiment = getReviewSentiment(review.Reviews, review.LLM_Cluster_Label);
          
          return (
            <Card 
              key={index} 
              className="glass-effect border-0 shadow-card hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedReview(review)}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg dashboard-gradient">
                        <MapPin className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{review.City}</h4>
                        <p className="text-sm text-muted-foreground">Review #{index + 1 + (currentPage - 1) * itemsPerPage}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={sentiment === 'positive' ? 'default' : sentiment === 'negative' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {sentiment}
                      </Badge>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </div>

                  {/* Review Text */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm leading-relaxed">
                      "{review.Reviews}"
                    </p>
                  </div>

                  {/* Clusters */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="space-y-2 flex-1">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Issue Type:</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {review.LLM_Cluster_Label}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Category:</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {review.LLM_Meta_Label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredData.length === 0 && (
        <Card className="glass-effect border-0 shadow-card">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reviews Found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search terms to find reviews.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Review Detail Modal */}
      {selectedReview && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedReview(null)}
        >
          <Card 
            className="glass-effect border-0 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Review Details - {selectedReview.City}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Customer Review:</h4>
                <p className="text-sm leading-relaxed">"{selectedReview.Reviews}"</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Location</h4>
                  <Badge variant="outline" className="w-fit">
                    <MapPin className="h-3 w-3 mr-1" />
                    {selectedReview.City}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Sentiment</h4>
                  <Badge 
                    variant={getReviewSentiment(selectedReview.Reviews, selectedReview.LLM_Cluster_Label) === 'positive' ? 'default' : 
                            getReviewSentiment(selectedReview.Reviews, selectedReview.LLM_Cluster_Label) === 'negative' ? 'destructive' : 'secondary'}
                    className="w-fit"
                  >
                    {getReviewSentiment(selectedReview.Reviews, selectedReview.LLM_Cluster_Label)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Specific Issue Type:</h4>
                  <Badge variant="outline" className="text-sm">
                    {selectedReview.LLM_Cluster_Label}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">General Category:</h4>
                  <Badge variant="secondary" className="text-sm">
                    {selectedReview.LLM_Meta_Label}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setSelectedReview(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};