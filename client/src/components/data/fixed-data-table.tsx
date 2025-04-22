import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSentimentBadgeClasses } from "@/lib/colors";
import { SentimentPost, deleteSentimentPost } from "@/lib/api";
import { format } from "date-fns";
import { Trash2, Search, Filter, Maximize2, Calendar, ExternalLink, Languages, MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDisasterContext } from "@/context/disaster-context";
import { CustomDialogTrigger, CustomAlertDialogTrigger } from "@/components/custom";
import { SentimentFeedback } from "@/components/sentiment-feedback";

interface DataTableProps {
  data: SentimentPost[];
  title?: string;
  description?: string;
}

const EMOTIONS = ["All", "Panic", "Fear/Anxiety", "Disbelief", "Resilience", "Neutral"];

export function DataTable({ 
  data, 
  title = "Sentiment Analysis Data",
  description = "Raw data from sentiment analysis"
}: DataTableProps) {
  const { toast } = useToast();
  const { refreshData } = useDisasterContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSentiment, setSelectedSentiment] = useState<string>("All");
  const [isDeleting, setIsDeleting] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const rowsPerPage = 10;

  // Handle delete post
  const handleDeletePost = async (id: number) => {
    try {
      setIsDeleting(true);
      const result = await deleteSentimentPost(id);
      toast({
        title: "Success",
        description: result.message,
        variant: "default",
      });
      refreshData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
    }
  };

  // Filter data based on search term and sentiment filter
  const filteredData = data.filter(item => {
    const matchesSearch = 
      item.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.disasterType?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSentiment = selectedSentiment === "All" ? true : item.sentiment === selectedSentiment;

    return matchesSearch && matchesSentiment;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  return (
    <Card className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <CardHeader className="p-6 bg-white border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            {title === "Complete Sentiment Dataset" ? (
              <>
                <CardTitle className="text-2xl font-bold text-indigo-700 flex items-center">
                  {title}
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-sm">
                    Primary Dataset
                  </span>
                </CardTitle>
                <CardDescription className="text-base text-slate-600 mt-2 max-w-2xl">
                  {description}
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-xl font-semibold text-indigo-700">
                  {title}
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 mt-1">{description}</CardDescription>
              </>
            )}
          </div>
          {/* Search and filter controls are moved to the Raw Data page header */}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Enhanced mobile responsiveness with proper overflow handling */}
        <div className="overflow-x-auto w-full" style={{ WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
          <Table className="w-full optimize-render" style={{ tableLayout: 'fixed', minWidth: '900px' }}>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-100">
                <TableHead className="whitespace-nowrap font-semibold text-slate-700 w-[20%]">Text</TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-slate-700 w-[10%]">Timestamp</TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-slate-700 w-[10%]">Source</TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-slate-700 w-[10%]">Location</TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-slate-700 w-[10%]">Disaster</TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-slate-700 w-[10%]">Sentiment</TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-slate-700 w-[10%]">Confidence</TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-slate-700 w-[10%]">Language</TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-slate-700 w-[10%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-20 text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center shadow-md">
                        <Search className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-xl font-medium bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent">
                        {searchTerm || selectedSentiment !== "All"
                          ? "No results match your search criteria" 
                          : "No data available"}
                      </p>
                      <p className="text-sm text-slate-500 max-w-md text-center">
                        {searchTerm || selectedSentiment !== "All" 
                          ? "Try adjusting your search terms or filters to find what you're looking for" 
                          : "Upload a CSV file using the upload button to analyze sentiment data"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className={`
                      border-b border-slate-100 
                      ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} 
                      hover:bg-blue-50/40 transition-colors
                    `}
                  >
                    <TableCell className="font-medium text-sm text-slate-700 max-w-xs">
                      <CustomDialogTrigger
                        className="flex items-center justify-between gap-2 w-full cursor-pointer group"
                        dialog={
                          <DialogContent className="sm:max-w-lg [&>[aria-label='Close']]:hidden">
                            <DialogHeader>
                              <DialogTitle className="text-xl flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-blue-500" />
                                <span>Full Message Content</span>
                              </DialogTitle>
                              <DialogDescription className="text-slate-500">
                                View the complete message content and details below.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="mt-4 space-y-6">
                              <div className="p-4 rounded-lg bg-white border border-slate-200">
                                <p className="text-base text-slate-700">{item.text}</p>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    <Calendar className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                                    Timestamp
                                  </div>
                                  <div className="text-sm font-medium text-slate-700">
                                    {format(new Date(item.timestamp), "PPP p")}
                                  </div>
                                </div>
                              
                                <div className="space-y-1">
                                  <div className="flex items-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    <ExternalLink className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                                    Source
                                  </div>
                                  <div className="text-sm font-medium text-slate-700">
                                    {item.source || "Unknown"}
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="flex items-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    <Languages className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                                    Language
                                  </div>
                                  <div className="text-sm font-medium text-slate-700">
                                    {item.language}
                                  </div>
                                </div>
                                
                                {/* Sentiment Information */}
                                <div className="space-y-1">
                                  <div className="flex items-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Sentiment
                                  </div>
                                  <div className="text-sm font-medium">
                                    <Badge 
                                      variant={getSentimentVariant(item.sentiment) as any}
                                      className="shadow-sm py-1"
                                    >
                                      {item.sentiment}
                                    </Badge>
                                  </div>
                                </div>
                                
                                {/* Confidence Score with Progress Bar */}
                                <div className="space-y-1 col-span-1 sm:col-span-2">
                                  <div className="flex items-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Confidence Score
                                  </div>
                                  <div className="mt-1">
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${getConfidenceColor(item.confidence)}`}
                                        style={{ width: `${item.confidence * 100}%` }}
                                      ></div>
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-slate-700 flex justify-between">
                                      <span>{(item.confidence * 100).toFixed(1)}%</span>
                                      <span className="text-xs text-slate-500">
                                        {item.confidence >= 0.9 ? 'Very High' : 
                                         item.confidence >= 0.7 ? 'High' : 
                                         item.confidence >= 0.5 ? 'Medium' : 'Low'} confidence
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Location Information */}
                                {item.location && (
                                  <div className="space-y-1">
                                    <div className="flex items-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                      Location
                                    </div>
                                    <div className="text-sm font-medium">
                                      <span className="inline-flex items-center">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5"></span>
                                        {item.location}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Disaster Type Information */}
                                {item.disasterType && (
                                  <div className="space-y-1">
                                    <div className="flex items-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                      Disaster Type
                                    </div>
                                    <div className="text-sm font-medium">
                                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${getDisasterTypeStyles(item.disasterType)}`}>
                                        {item.disasterType}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <DialogFooter className="mt-6 justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Suggest a correction:</span>
                                <SentimentFeedback 
                                  originalText={item.text}
                                  originalSentiment={item.sentiment}
                                  onFeedbackSubmitted={() => {
                                    refreshData();
                                    toast({
                                      title: "Feedback submitted",
                                      description: "Thank you for helping us improve our model!",
                                    });
                                  }}
                                />
                              </div>
                              <DialogClose asChild>
                                <Button variant="outline" className="rounded-full bg-white border-slate-200 hover:bg-slate-50">
                                  Close
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        }
                      >
                        <div className="truncate max-w-[180px] md:max-w-[250px] lg:max-w-[300px] text-xs sm:text-sm">
                          {item.text}
                        </div>
                        <Maximize2 className="h-4 w-4 text-slate-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CustomDialogTrigger>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                      <div className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs sm:text-sm overflow-hidden text-ellipsis max-w-full">
                        {format(new Date(item.timestamp), "yyyy-MM-dd HH:mm:ss")}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      <div className="inline-flex items-center gap-1 text-xs sm:text-sm overflow-hidden text-ellipsis max-w-full">
                        {item.source || "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      <div className="inline-flex items-center gap-1 overflow-hidden text-ellipsis max-w-full">
                        {item.location ? (
                          <span className="inline-flex items-center text-xs sm:text-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 sm:mr-1.5 flex-shrink-0"></span>
                            <span className="truncate">{item.location}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-slate-400 text-xs sm:text-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 mr-1 sm:mr-1.5 flex-shrink-0"></span>
                            <span className="truncate">UNKNOWN</span>
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {item.disasterType && item.disasterType !== "UNKNOWN" ? (
                        <div className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded shadow-sm text-xs ${getDisasterTypeStyles(item.disasterType)} truncate max-w-full`}>
                          {item.disasterType}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs sm:text-sm">UNKNOWN</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getSentimentVariant(item.sentiment) as any}
                        className="shadow-sm text-xs whitespace-nowrap"
                      >
                        {item.sentiment}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      <div className="w-full max-w-[60px] bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${getConfidenceColor(item.confidence)}`}
                          style={{ width: `${item.confidence * 100}%` }}
                        ></div>
                      </div>
                      <div className="mt-1 text-xs font-medium text-slate-600">
                        {(item.confidence * 100).toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-xs whitespace-nowrap">
                        {item.language}
                      </div>
                    </TableCell>
                    <TableCell>
                      <CustomAlertDialogTrigger
                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:shadow-sm transition-all duration-200 rounded-full flex items-center justify-center cursor-pointer"
                        onClick={() => setPostToDelete(item.id)}
                        dialog={
                          <AlertDialogContent className="bg-white border-slate-200 rounded-xl shadow-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-xl">Delete this post?</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-600">
                                This will permanently delete the sentiment analysis result from the database.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-full hover:bg-slate-100">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePost(item.id)}
                                className="rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md"
                              >
                                {isDeleting && postToDelete === item.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  "Delete"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </CustomAlertDialogTrigger>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Enhanced Pagination - Improved for mobile */}
        {totalPages > 1 && (
          <div className="py-4 px-3 sm:px-6 bg-white border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              {/* Record count indicator */}
              <div className="flex justify-center sm:justify-start order-1 sm:order-none">
                <div className="text-xs uppercase tracking-wider font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100/50">
                  {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length}
                </div>
              </div>
              
              {/* Pagination controls - always centered on mobile, right-aligned on larger screens */}
              <div className="flex justify-center sm:justify-end order-0 sm:order-none mb-2 sm:mb-0">
                <div className="flex shadow-sm rounded-full bg-white p-1 border border-slate-200">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`
                    h-8 w-8 rounded-full transition-all duration-200 
                    ${currentPage === 1 
                      ? 'text-slate-400 cursor-not-allowed' 
                      : 'text-blue-600 hover:bg-blue-100'
                    }
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                  <span className="sr-only">Previous</span>
                </Button>

                <div className="px-3 text-sm font-medium text-indigo-800 flex items-center">
                  Page <span className="mx-1 w-5 text-center">{currentPage}</span> of <span className="mx-1 w-5 text-center">{totalPages}</span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`
                    h-8 w-8 rounded-full transition-all duration-200 
                    ${currentPage === totalPages 
                      ? 'text-slate-400 cursor-not-allowed' 
                      : 'text-blue-600 hover:bg-blue-100'
                    }
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                  <span className="sr-only">Next</span>
                </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const getSentimentVariant = (sentiment: string) => {
  switch (sentiment) {
    case 'Panic': return 'panic';
    case 'Fear/Anxiety': return 'fear';
    case 'Disbelief': return 'disbelief';
    case 'Resilience': return 'resilience';
    case 'Neutral': 
    default: return 'neutral';
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.9) {
    return 'bg-gradient-to-r from-emerald-500 to-green-500';
  } else if (confidence >= 0.7) {
    return 'bg-gradient-to-r from-blue-500 to-indigo-500';
  } else if (confidence >= 0.5) {
    return 'bg-gradient-to-r from-yellow-500 to-amber-500';
  } else {
    return 'bg-gradient-to-r from-red-500 to-rose-500';
  }
};

const getDisasterTypeStyles = (disasterType: string) => {
  // Using the same colors as in the geographic indicators
  switch (disasterType.toLowerCase()) {
    case 'fire':
    case 'sunog':
      return 'bg-gradient-to-r from-red-600 to-orange-500 text-white border border-red-700/20';
    case 'flood':
    case 'baha':
      return 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white border border-blue-700/20';
    case 'earthquake':
    case 'lindol':
      return 'bg-gradient-to-r from-amber-600 to-yellow-500 text-white border border-amber-700/20';
    case 'typhoon':
    case 'bagyo':
      return 'bg-gradient-to-r from-blue-800 to-indigo-900 text-white border border-blue-900/20';
    case 'tsunami':
      return 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white border border-indigo-700/20';
    case 'landslide':
    case 'pagguho':
      return 'bg-gradient-to-r from-amber-700 to-yellow-600 text-white border border-amber-800/20';
    case 'volcanic eruption':
    case 'bulkang pagputok':
      return 'bg-gradient-to-r from-stone-600 to-slate-500 text-white border border-stone-700/20';
    default:
      return 'bg-gradient-to-r from-purple-600 to-violet-500 text-white border border-purple-700/20';
  }
};