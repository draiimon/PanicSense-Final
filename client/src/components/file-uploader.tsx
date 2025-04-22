import { AnimatePresence, motion } from "framer-motion";
import { useDisasterContext } from "@/context/disaster-context";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { FileUploaderButton } from "./file-uploader-button";
// Removed UploadProgressModal import since it's now globally included in App.tsx

interface FileUploaderProps {
  onSuccess?: (data: any) => void;
  className?: string;
  id?: string;
}

export function FileUploader({ onSuccess, className, id }: FileUploaderProps) {
  // Removed UploadProgressModal since it's now included globally in App.tsx
  return <FileUploaderButton id={id} onSuccess={onSuccess} className={className} />;
}