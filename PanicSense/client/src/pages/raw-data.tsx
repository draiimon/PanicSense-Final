import { useState } from "react";
import { useDisasterContext } from "@/context/disaster-context";
import { DataTable } from "@/components/data/fixed-data-table";
import { FileUploader } from "@/components/file-uploader";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertCircle, 
  Database, 
  Search,
  FileText, 
  MessageSquareText, 
  Smile, 
  MapPin, 
  Loader2, 
  Trash2, 
  Download, 
  FileCheck,
  FileX
} from "lucide-react";
import { deleteAllData, deleteAnalyzedFile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CustomAlertDialogTrigger } from "@/components/custom";

// Create motion variants for animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100 }
  }
};

// Animated components
const AnimatedCard = motion(Card);

// Language mapping
const languageMap: Record<string, string> = {
  en: "English",
  tl: "Filipino",
};

// Get sentiment color
const getSentimentColor = (sentiment: string) => {
  switch (sentiment?.toLowerCase()) {
    case 'positive':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'neutral':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'negative':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'fear/anxiety':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'panic':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'disbelief':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Get disaster color
const getDisasterColor = (disaster: string) => {
  switch (disaster?.toLowerCase()) {
    case 'flood':
      return 'bg-blue-100 text-blue-800';
    case 'fire':
      return 'bg-red-100 text-red-800';
    case 'earthquake':
      return 'bg-orange-100 text-orange-800';
    case 'typhoon':
      return 'bg-cyan-100 text-cyan-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function RawData() {
  const { toast } = useToast();
  const {
    sentimentPosts = [],
    analyzedFiles = [],
    isLoadingSentimentPosts,
    isLoadingAnalyzedFiles,
    refreshData,
  } = useDisasterContext();
  
  const [selectedFileId, setSelectedFileId] = useState<string>("all");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDeleteAllData = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteAllData();
      toast({
        title: "Success",
        description: result.message,
        variant: "default",
      });
      // Refresh the data
      refreshData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      setDeletingFileId(fileId);
      const result = await deleteAnalyzedFile(fileId);

      // If current selected file was deleted, reset to 'all'
      if (selectedFileId === fileId.toString()) {
        setSelectedFileId("all");
      }

      toast({
        title: "Success",
        description: result.message,
        variant: "default",
      });
      // Refresh the data
      refreshData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingFileId(null);
    }
  };

  const isLoading = isLoadingSentimentPosts || isLoadingAnalyzedFiles;

  // Make sure sentimentPosts is an array
  const postsArray = Array.isArray(sentimentPosts) ? sentimentPosts : [];

  // Filter posts by file ID if selected
  const filteredPosts =
    selectedFileId === "all"
      ? postsArray
      : postsArray.filter(
          (post) => post.fileId === parseInt(selectedFileId),
        );

  // Apply text search filter
  const searchFilteredPosts = searchQuery 
    ? filteredPosts.filter(post => 
        post.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.sentiment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.disasterType?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredPosts;

  // Transform posts to display full language names (with safety check)
  const transformedPosts = Array.isArray(searchFilteredPosts) 
    ? searchFilteredPosts.map((post) => ({
        ...post,
        language: languageMap[post.language] || post.language,
      }))
    : [];

  // Calculate statistics
  const totalRecords = transformedPosts.length;
  
  // Count sentiment types
  const sentimentCounts = transformedPosts.reduce((acc, post) => {
    const sentiment = post.sentiment || 'Unknown';
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Count disaster types
  const disasterCounts = transformedPosts.reduce((acc, post) => {
    const disasterType = post.disasterType || 'Unknown';
    acc[disasterType] = (acc[disasterType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="relative min-h-screen">
        {/* Enhanced background - EXACTLY LIKE REAL-TIME PAGE */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-violet-50 to-pink-50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/15 via-teal-500/10 to-rose-500/15 animate-gradient"
            style={{ backgroundSize: "200% 200%" }} />
            
          <div className="absolute inset-0 opacity-15 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM1MDUwRjAiIGZpbGwtb3BhY2l0eT0iMC41Ij48cGF0aCBkPSJNMzYgMzR2Nmg2di02aC02em02IDZ2Nmg2di02aC02em0tMTIgMGg2djZoLTZ2LTZ6bTEyIDBoNnY2aC02di02eiIvPjwvZz48L2c+PC9zdmc+')]" />
          
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(120,80,255,0.8)_0%,transparent_70%)]" />
          
          <div className="absolute h-72 w-72 rounded-full bg-purple-500/25 filter blur-3xl animate-float-1 will-change-transform"
            style={{ top: "15%", left: "8%" }} />
            
          <div className="absolute h-64 w-64 rounded-full bg-teal-500/20 filter blur-3xl animate-float-2 will-change-transform"
            style={{ bottom: "15%", right: "15%" }} />
            
          <div className="absolute h-52 w-52 rounded-full bg-purple-500/25 filter blur-3xl animate-float-3 will-change-transform"
            style={{ top: "45%", right: "20%" }} />
          
          <div className="absolute h-48 w-48 rounded-full bg-pink-500/20 filter blur-3xl animate-float-4 will-change-transform"
            style={{ top: "65%", left: "25%" }} />
            
          <div className="absolute h-40 w-40 rounded-full bg-yellow-400/15 filter blur-3xl animate-float-5 will-change-transform"
            style={{ top: "35%", left: "50%" }} />
        </div>
        
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 flex items-center justify-center mb-4 shadow-md">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-700 to-blue-600 bg-clip-text text-transparent">Loading data...</h3>
          <p className="text-slate-500 mt-2">Retrieving sentiment analysis information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Enhanced background - EXACTLY LIKE REAL-TIME PAGE */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-violet-50 to-pink-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/15 via-teal-500/10 to-rose-500/15 animate-gradient"
          style={{ backgroundSize: "200% 200%" }} />
          
        <div className="absolute inset-0 opacity-15 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM1MDUwRjAiIGZpbGwtb3BhY2l0eT0iMC41Ij48cGF0aCBkPSJNMzYgMzR2Nmg2di02aC02em02IDZ2Nmg2di02aC02em0tMTIgMGg2djZoLTZ2LTZ6bTEyIDBoNnY2aC02di02eiIvPjwvZz48L2c+PC9zdmc+')]" />
        
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(120,80,255,0.8)_0%,transparent_70%)]" />
        
        <div className="absolute h-72 w-72 rounded-full bg-purple-500/25 filter blur-3xl animate-float-1 will-change-transform"
          style={{ top: "15%", left: "8%" }} />
          
        <div className="absolute h-64 w-64 rounded-full bg-teal-500/20 filter blur-3xl animate-float-2 will-change-transform"
          style={{ bottom: "15%", right: "15%" }} />
          
        <div className="absolute h-52 w-52 rounded-full bg-purple-500/25 filter blur-3xl animate-float-3 will-change-transform"
          style={{ top: "45%", right: "20%" }} />
        
        <div className="absolute h-48 w-48 rounded-full bg-pink-500/20 filter blur-3xl animate-float-4 will-change-transform"
          style={{ top: "65%", left: "25%" }} />
          
        <div className="absolute h-40 w-40 rounded-full bg-yellow-400/15 filter blur-3xl animate-float-5 will-change-transform"
          style={{ top: "35%", left: "50%" }} />
      </div>
      
      <motion.div 
        className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header - Exactly like realtime page */}
        <motion.div 
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border-none shadow-lg bg-gradient-to-r from-indigo-600/90 via-blue-600/90 to-purple-600/90 p-4 sm:p-4"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 animate-gradient" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm shadow-inner">
                <Database className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  Raw Data Explorer
                </h1>
                <p className="text-xs sm:text-sm text-indigo-100 mt-0.5 sm:mt-1">
                  Browse and analyze bilingual sentiment data collected from social media during disaster events
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Upload button */}
          <Card className="overflow-hidden border-none shadow-md rounded-2xl bg-white/90 backdrop-blur-sm border border-indigo-100/40">
            <CardHeader className="pb-3 pt-5">
              <CardTitle className="flex items-center gap-2 text-lg font-medium">
                <FileCheck className="h-5 w-5 text-emerald-500" />
                Upload Dataset
              </CardTitle>
              <CardDescription>
                Import CSV files for sentiment analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-5">
              <FileUploader className="w-full" />
            </CardContent>
          </Card>

          {/* Download button */}
          <Card className="overflow-hidden border-none shadow-md rounded-2xl bg-white/90 backdrop-blur-sm border border-indigo-100/40">
            <CardHeader className="pb-3 pt-5">
              <CardTitle className="flex items-center gap-2 text-lg font-medium">
                <Download className="h-5 w-5 text-blue-500" />
                Export Data
              </CardTitle>
              <CardDescription>
                Save the current dataset as CSV
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-5">
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch("/api/export-csv");
                    if (!response.ok) throw new Error("Failed to download data");

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "disaster-sentiments.csv";
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    toast({
                      title: "Success",
                      description: "Data exported successfully",
                      variant: "default",
                    });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to export data",
                      variant: "destructive",
                    });
                  }
                }}
                className="w-full relative flex items-center justify-center px-5 py-2.5 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-105 transition-all duration-200 overflow-hidden font-medium"
              >
                <Download className="h-4 w-4 mr-2" />
                <span>Download CSV</span>
              </Button>
            </CardContent>
          </Card>

          {/* Delete data card */}
          <Card className="overflow-hidden border-none shadow-md rounded-2xl bg-white/90 backdrop-blur-sm border border-indigo-100/40">
            <CardHeader className="pb-3 pt-5">
              <CardTitle className="flex items-center gap-2 text-lg font-medium">
                <Trash2 className="h-5 w-5 text-red-500" />
                Delete Data
              </CardTitle>
              <CardDescription>
                Remove all records from the database
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-5">
              <CustomAlertDialogTrigger
                className="w-full relative flex items-center justify-center px-5 py-2.5 h-10 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md hover:from-red-700 hover:to-rose-700 hover:shadow-lg hover:scale-105 transition-all duration-200 overflow-hidden cursor-pointer font-medium"
                dialog={
                  <AlertDialogContent className="bg-white border-slate-200 rounded-xl shadow-xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-600">
                        This action will permanently delete all sentiment posts,
                        disaster events, and analyzed files from the database. This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-full hover:bg-slate-100">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAllData}
                        className="rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md font-medium"
                      >
                        Yes, Delete All Data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                }
              >
                <div className="flex items-center justify-center">
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span>Delete All Data</span>
                    </>
                  )}
                </div>
              </CustomAlertDialogTrigger>
            </CardContent>
          </Card>
        </div>

        {/* Dataset Selection */}
        <Card className="border-none shadow-lg rounded-2xl bg-white/90 backdrop-blur-sm border border-indigo-100/40">
          <CardHeader className="p-4 bg-gradient-to-r from-indigo-600/90 via-blue-600/90 to-purple-600/90 border-b border-gray-200/40 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold text-white">
              <FileText className="h-5 w-5" />
              Dataset Selection
            </CardTitle>
            <CardDescription className="text-indigo-100">
              Choose which dataset to view or select all data
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 pb-2">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Dataset</label>
                <Select value={selectedFileId} onValueChange={setSelectedFileId}>
                  <SelectTrigger className="w-full bg-white border border-indigo-200 rounded-lg">
                    <SelectValue placeholder="All datasets" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-indigo-200 rounded-lg">
                    <SelectItem value="all" className="focus:bg-indigo-50">
                      <div className="flex items-center">
                        <Database className="h-4 w-4 mr-2 text-indigo-500" />
                        <span>All datasets</span>
                      </div>
                    </SelectItem>
                    {Array.isArray(analyzedFiles) && analyzedFiles.map((file) => (
                      <div key={file.id} className="flex justify-between items-center">
                        <SelectItem value={file.id.toString()} className="focus:bg-indigo-50 flex-grow">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-indigo-500" />
                            <span>{file.originalName}</span>
                            <Badge variant="outline" className="ml-2 bg-indigo-50 text-indigo-700">
                              {file.recordCount} records
                            </Badge>
                          </div>
                        </SelectItem>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault(); 
                            handleDeleteFile(file.id);
                          }}
                          className="h-8 w-8 mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50"
                        >
                          {deletingFileId === file.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileX className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="border-none shadow-lg rounded-2xl bg-white/90 backdrop-blur-sm border border-indigo-100/40">
          <CardHeader className="p-4 bg-gradient-to-r from-indigo-600/90 via-blue-600/90 to-purple-600/90 border-b border-gray-200/40 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold text-white">
              <MessageSquareText className="h-5 w-5" />
              Raw Data from Sentiment Analysis
            </CardTitle>
            <CardDescription className="text-indigo-100">
              {transformedPosts.length} records found | Showing sentiment, location and disaster data
            </CardDescription>
            
            {/* Full width search bar with consistent UI styling */}
            <div className="w-full">
              <div className="relative flex items-center">
                <Input
                  placeholder="Search in all columns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white border border-indigo-200 rounded-lg shadow-sm"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 border-t border-indigo-200/40">
            {!isLoading && Array.isArray(transformedPosts) && transformedPosts.length > 0 ? (
              <div className="mt-0">
                <DataTable 
                  data={transformedPosts} 
                  title="" 
                  description=""
                />
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <div className="flex flex-col items-center">
                  <AlertCircle className="h-12 w-12 text-indigo-300 mb-2" />
                  <p>No data available. Upload a CSV file to begin.</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-4 border-t border-indigo-100/30 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-b-2xl flex justify-between">
            <div className="flex items-center text-xs text-gray-500">
              <span>Last updated: {new Date().toLocaleString()}</span>
            </div>
            <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">
              Raw data explorer
            </Badge>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}