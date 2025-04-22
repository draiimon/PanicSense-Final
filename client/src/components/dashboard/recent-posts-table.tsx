import { format } from 'date-fns';
import { Link } from 'wouter';
import { SentimentPost } from '@/lib/api';
import { getSentimentBadgeClasses, getDisasterTypeColor } from '@/lib/colors';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowUpRight, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export interface RecentPostsTableProps {
  posts: SentimentPost[];
  title?: string;
  description?: string;
  limit?: number;
  showViewAllLink?: boolean;
  isLoading?: boolean;
}

export function RecentPostsTable({ 
  posts = [], 
  title = 'Recent Analyzed Posts',
  description = 'Latest social media sentiment',
  limit = 5,
  showViewAllLink = true,
  isLoading = false
}: RecentPostsTableProps) {
  // Take only the most recent posts, limited by the limit prop
  const displayedPosts = posts?.slice(0, limit) || [];

  if (isLoading) {
    return (
      <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="py-4 px-6 border-b border-gray-100">
            <div className="flex justify-between items-start">
              <div className="w-full">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="flex gap-3 mt-2">
                  <div className="h-3 bg-slate-200 rounded w-16"></div>
                  <div className="h-3 bg-slate-200 rounded w-16"></div>
                  <div className="h-3 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (displayedPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
          <AlertTriangle className="h-7 w-7 text-blue-400" />
        </div>
        <p className="text-center text-base text-slate-500 mb-2">No posts available</p>
        <p className="text-center text-sm text-slate-400">Upload data to see recent social media posts</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {displayedPosts.map((post, index) => (
        <motion.div 
          key={post.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className={`px-6 py-4 border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${
            index === displayedPosts.length - 1 ? 'border-b-0 rounded-b-xl' : ''
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-slate-700 flex-grow">{post.text}</p>
              <div className="flex-shrink-0">
                <Badge 
                  className={`${getSentimentBadgeClasses(post.sentiment)} text-xs whitespace-nowrap`}
                >
                  {post.sentiment}
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" />
                <span>{format(new Date(post.timestamp), 'MMM d, yyyy h:mm a')}</span>
              </div>
              
              {post.location && post.location !== "UNKNOWN" && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  <span>{post.location}</span>
                </div>
              )}
              
              {post.disasterType && post.disasterType !== "UNKNOWN" && (
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: getDisasterTypeColor(post.disasterType) }}></div>
                  <span>{post.disasterType}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                  {post.source || 'Unknown'}
                </span>
              </div>
              
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium">
                  {(post.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
      
      {showViewAllLink && (
        <Link href="/raw-data">
          <div className="bg-blue-50/50 hover:bg-blue-50 transition-colors py-3 px-6 rounded-b-xl flex items-center justify-center text-sm font-medium text-blue-600 cursor-pointer border-t border-blue-100/50">
            View all data
            <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
          </div>
        </Link>
      )}
    </div>
  );
}
