import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { submitSentimentFeedback, SentimentFeedback as SentimentFeedbackType } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThumbsUp, ThumbsDown, MapPin, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface SentimentFeedbackProps {
  originalText: string;
  originalSentiment: string;
  originalLocation?: string;
  originalDisasterType?: string;
  onFeedbackSubmitted?: () => void;
}

export function SentimentFeedback({ 
  originalText, 
  originalSentiment, 
  originalLocation = "UNKNOWN", 
  originalDisasterType = "UNKNOWN", 
  onFeedbackSubmitted 
}: SentimentFeedbackProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [correctedSentiment, setCorrectedSentiment] = useState<string>("");
  const [correctedLocation, setCorrectedLocation] = useState<string>("");
  const [correctedDisasterType, setCorrectedDisasterType] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("sentiment");
  const [includeLocation, setIncludeLocation] = useState<boolean>(false);
  const [includeDisasterType, setIncludeDisasterType] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState("");
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizFeedback, setQuizFeedback] = useState("");
  const { toast } = useToast();

  const sentimentOptions = [
    "Panic",
    "Fear/Anxiety",
    "Disbelief",
    "Resilience",
    "Neutral"
  ];

  const disasterTypeOptions = [
    "Typhoon",
    "Flood",
    "Earthquake",
    "Landslide",
    "Volcanic Eruption",
    "Tsunami",
    "Fire",
    "Drought",
    "Storm Surge",
    "Other"
  ];

  // Common Philippine locations
  const locationSuggestions = [
    "Manila", "Quezon City", "Davao", "Cebu", "Baguio",
    "Tacloban", "Batangas", "Cavite", "Laguna", "Rizal",
    "Pampanga", "Bulacan", "Zambales", "Bataan", "Ilocos",
    "Pangasinan", "La Union", "Isabela", "Cagayan", "Bicol",
    "Sorsogon", "Albay", "Camarines Sur", "Camarines Norte", "Palawan",
    "Mindoro", "Marinduque", "Romblon", "Aklan", "Antique",
    "Capiz", "Iloilo", "Negros", "Leyte", "Samar",
    "Bohol", "Bukidnon", "Misamis", "Zamboanga", "Basilan",
    "Sulu", "Tawi-Tawi", "Cotabato", "Maguindanao", "Sultan Kudarat",
    "South Cotabato", "Agusan", "Surigao", "Dinagat Islands"
  ];

  // Filter out the original sentiment from options
  const filteredOptions = sentimentOptions.filter(
    sentiment => sentiment !== originalSentiment
  );

  const resetForm = () => {
    setCorrectedSentiment("");
    setCorrectedLocation("");
    setCorrectedDisasterType("");
    setIncludeLocation(false);
    setIncludeDisasterType(false);
    setActiveTab("sentiment");
  };
  
  // This is now a pure pass-through function - all validation is done by the Python AI model
  const validateSentimentChange = (): { valid: boolean, message: string | null } => {
    // Always return valid - the real verification happens on the server using the Python AI model
    // We've removed all client-side validation rules to focus purely on AI-based validation
    return { valid: true, message: null };
  };
  
  // Helper function to check if text is in question form (daw/raw/?, etc)
  const containsQuestionForm = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return (
      text.includes("?") || 
      lowerText.includes("daw") || 
      lowerText.includes("raw") || 
      lowerText.includes("ba") || 
      lowerText.includes("kaya") || 
      lowerText.includes("talaga")
    );
  };
  
  // Helper function to detect serious disaster indications that override joke markers
  const hasSeriosDisasterIndication = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    const seriousIndicators = [
      "mamatay", "patay", "papatayin", "namatay",
      "died", "dead", "death", "killed",
      "casualties", "casualty", "victim", "victims",
      "injured", "injuries", "wounded", "wound",
      "emergency", "emerhensi", "evac", "evacuate"
    ];
    
    return seriousIndicators.some(indicator => lowerText.includes(indicator));
  };
  
  // Function to check if text contains joke/sarcasm indicators
  const containsJokeIndicators = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    const jokeIndicators = [
      "haha", "hehe", "lol", "lmao", "ulol", "gago", "tanga", 
      "daw?", "raw?", "talaga?", "really?", "😂", "🤣",
      "joke", "jokes", "joke lang", "eme", "charot", "char", "joke time",
      "jk", "kidding", "just kidding", "sarcasm"
    ];
    
    // Check for laughter patterns
    if (jokeIndicators.some(indicator => lowerText.includes(indicator))) {
      return true;
    }
    
    // Check for multiple exclamation marks with "haha"
    if (lowerText.includes("haha") && text.includes("!")) {
      return true;
    }
    
    // Check for capitalized laughter
    if (text.includes("HAHA") || text.includes("HEHE")) {
      return true;
    }
    
    return false;
  };
  
  // Function to check if text contains disaster keywords
  const containsDisasterKeywords = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    const disasterKeywords = [
      "earthquake", "lindol", "fire", "sunog", "flood", "baha", 
      "typhoon", "bagyo", "tsunami", "landslide", "nagiba"
    ];
    
    return disasterKeywords.some(keyword => lowerText.includes(keyword));
  };

  const verifyWithQuiz = async () => {
    setIsSubmitting(true);
    setQuizMode(true);
    
    // Show validating feedback (hide that it's a quiz - backend concern only)
    toast({
      title: "Validating...",
      description: "Please wait while we process your feedback",
    });
    
    try {
      // Only proceed if there's a sentiment correction - for now
      if (!correctedSentiment && !includeLocation && !includeDisasterType) {
        toast({
          title: "Selection required",
          description: "Please select at least one correction to provide feedback on",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Make the API call but don't complete the full submission
      const response = await submitSentimentFeedback(
        originalText,
        originalSentiment,
        correctedSentiment,
        includeLocation ? correctedLocation : undefined,
        includeDisasterType ? correctedDisasterType : undefined
      );
      
      console.log("Validation response:", response);
      
      // AGGRESSIVELY force UI refresh FIRST, before showing explanation
      // This ensures the UI updates even if the explanation is displayed
      
      // Force a data refresh by triggering a custom event for UI components to listen to
      const refreshEvent = new CustomEvent('sentiment-data-changed', {
        detail: {
          text: originalText,
          newSentiment: correctedSentiment,
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(refreshEvent);
      
      // Also call the callback if provided
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
      
      // Show complete explanation feedback from the AI
      if (response.aiTrustMessage) {
        // Show warning with the actual explanation from the AI
        setWarningMessage(response.aiTrustMessage);
        setWarningOpen(true);
        
        // Show a toast notification to indicate success, even with warnings
        toast({
          title: "Feedback analyzed",
          description: "Check the explanation for details about your feedback",
          variant: "default" // Changed from destructive to default for better UX
        });
      } else {
        // Success! Sentiment matched what AI expected
        toast({
          title: "Feedback submitted",
          description: "Thank you for helping improve our AI analysis system",
        });
        
        // Close dialog and reset form
        setIsOpen(false);
        resetForm();
        
        // Call callback for UI refresh
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted();
        }
      }
    } catch (error) {
      console.error("Error submitting sentiment feedback:", error);
      toast({
        title: "Validation failed",
        description: "There was an error processing your feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setQuizMode(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!correctedSentiment && !includeLocation && !includeDisasterType) {
      toast({
        title: "Selection required",
        description: "Please select at least one correction to provide feedback on",
        variant: "destructive",
      });
      return;
    }
    
    // Check if sentiment change is valid (only if correctedSentiment is provided)
    if (correctedSentiment) {
      const validationResult = validateSentimentChange();
      if (!validationResult.valid && validationResult.message) {
        // Show validation warning directly in UI
        setWarningMessage(validationResult.message);
        setWarningOpen(true);
        // Return without submitting - this blocks the submission completely
        return;
      }
    }

    if (includeLocation && !correctedLocation) {
      toast({
        title: "Location required",
        description: "Please enter a location or uncheck the location checkbox",
        variant: "destructive",
      });
      setActiveTab("location");
      return;
    }

    if (includeDisasterType && !correctedDisasterType) {
      toast({
        title: "Disaster type required",
        description: "Please select a disaster type or uncheck the disaster type checkbox",
        variant: "destructive",
      });
      setActiveTab("disaster");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitSentimentFeedback(
        originalText,
        originalSentiment,
        correctedSentiment,
        includeLocation ? correctedLocation : undefined,
        includeDisasterType ? correctedDisasterType : undefined
      );

      console.log("Raw response from server:", JSON.stringify(response));
      console.log("Successfully parsed sentiment feedback response:", response);
      console.log("Validation response:", response);

      // ALWAYS SHOW THE FEEDBACK POPUP with the validation message
      // This ensures that the explanation always shows up regardless of response format
      
      // Extract the message from any of the possible fields or fallback to default
      // SIMPLIFIED MESSAGE EXTRACTION - no more trainingError field
      const validationMessage = 
        // If status is error, use the message directly  
        response.status === "error" ? response.message : 
        // If we have a message field, use it (from normal validation)
        response.message ? response.message :
        // If we have AI trust message (from trolling detection)
        response.aiTrustMessage ? response.aiTrustMessage :
        // Default message if all else fails
        "Feedback received. AI analysis results will be updated.";
      
      // DIRECT UPDATE OF UI - MOST RELIABLE WAY!
      // Directly call the window functions exposed by components to fix UI instantly
      if (correctedSentiment) {
        try {
          // Update realtime monitor if that function exists
          const updateRealtimeFn = (window as any).updateRealtimeSentiment;
          if (typeof updateRealtimeFn === 'function') {
            updateRealtimeFn(originalText, correctedSentiment, validationMessage || undefined);
            console.log("Used direct sentiment update function to refresh realtime UI with message:", validationMessage || "No message provided");
          }
          
          // ALSO update data table if that function exists
          const updateDataTableFn = (window as any).updateDataTable;
          if (typeof updateDataTableFn === 'function') {
            updateDataTableFn(originalText, correctedSentiment, validationMessage || undefined);
            console.log("Used direct data table update function to refresh raw data view with message:", validationMessage || "No message provided");
          }
        } catch (updateError) {
          console.error("Error using direct update:", updateError);
        }
      }

      // Always show the popup dialog with the message after the update
      setWarningMessage(validationMessage || "Feedback received. Thank you for helping improve our AI.");
      setWarningOpen(true);
      
      // ALSO show a toast notification with the validation message for higher visibility
      toast({
        title: "Feedback Processed!",
        description: validationMessage,
        // Use default variant instead of success to fix type error
        variant: "default",
        duration: 5000,
      });
      
      // Close dialog and reset form
      setIsOpen(false);
      resetForm();
      
      // Always call the onFeedbackSubmitted callback to force UI refresh immediately
      // This MUST happen regardless of warning or success, so the frontend updates instantly
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      } else {
        // Force a data refresh by triggering a custom event for UI components to listen to
        const refreshEvent = new CustomEvent('sentiment-data-changed', {
          detail: {
            text: originalText,
            newSentiment: correctedSentiment,
            timestamp: new Date().toISOString(),
            validationMessage: validationMessage // Add validation message to event detail for UI components
          }
        });
        window.dispatchEvent(refreshEvent);
      }
    } catch (error) {
      console.error("Error submitting sentiment feedback:", error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // We removed the WebSocket connection as it was causing issues
  // Instead, we're directly showing warnings based on API responses

  return (
    <>
      <AlertDialog open={warningOpen} onOpenChange={setWarningOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-600 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              AI Feedback Results
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              <div className="p-4 border border-blue-200 bg-blue-50 rounded-md mb-3 whitespace-pre-line font-medium text-blue-800">
                {warningMessage || "Our AI analyzed this text and made a sentiment classification."}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {correctedSentiment && validateSentimentChange().valid === false ? (
                  // Client-side validation message (submission blocked) - should never happen now
                  "Your feedback cannot be submitted due to this validation issue. Please review your changes."
                ) : (
                  // Server-side validation feedback (submission allowed)
                  "Your feedback has been accepted. The AI model has been updated with your input."
                )}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-blue-600 hover:bg-blue-700 text-white">
              {correctedSentiment && validateSentimentChange().valid === false ? 
                "Go Back and Fix" : 
                "Thanks for Teaching Me!"
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost" 
            size="sm"
            className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
            onClick={() => setIsOpen(true)}
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            <span className="text-xs">Incorrect?</span>
          </Button>
        </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Improve Sentiment Analysis</DialogTitle>
          <DialogDescription>
            Your feedback helps us make our sentiment analysis more accurate.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Original Text</h3>
            <p className="text-sm p-2 bg-slate-50 rounded border border-slate-200">
              {originalText}
            </p>
          </div>
          
          <Tabs defaultValue="sentiment" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="disaster">Disaster Type</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sentiment" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Current Analysis</h3>
                  <div className="px-3 py-2 bg-red-50 text-red-700 rounded border border-red-200">
                    {originalSentiment}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Corrected Sentiment</h3>
                  <Select 
                    value={correctedSentiment} 
                    onValueChange={setCorrectedSentiment}
                  >
                    <SelectTrigger className={`w-full ${correctedSentiment && !validateSentimentChange().valid ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select sentiment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Available Sentiments</SelectLabel>
                        {filteredOptions.map((sentiment) => (
                          <SelectItem key={sentiment} value={sentiment}>
                            {sentiment}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  
                  {/* Show instant validation feedback */}
                  {correctedSentiment && !validateSentimentChange().valid && (
                    <div className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      {validateSentimentChange().message}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="location" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-location" 
                    checked={includeLocation}
                    onCheckedChange={(checked) => {
                      if (typeof checked === 'boolean') setIncludeLocation(checked);
                      if (!checked) setCorrectedLocation("");
                    }}
                  />
                  <label 
                    htmlFor="include-location" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include location correction
                  </label>
                </div>
                
                {includeLocation && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Current Location</h3>
                        <div className="px-3 py-2 bg-blue-50 text-blue-700 rounded border border-blue-200">
                          {originalLocation === "UNKNOWN" ? "Not detected" : originalLocation}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Corrected Location</h3>
                        <Select value={correctedLocation} onValueChange={setCorrectedLocation}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Common Locations</SelectLabel>
                              {locationSuggestions.map((location) => (
                                <SelectItem key={location} value={location}>
                                  {location}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          Or type a custom location:
                        </p>
                        <Input 
                          placeholder="Enter location" 
                          value={correctedLocation}
                          onChange={(e) => setCorrectedLocation(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="disaster" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-disaster" 
                    checked={includeDisasterType}
                    onCheckedChange={(checked) => {
                      if (typeof checked === 'boolean') setIncludeDisasterType(checked);
                      if (!checked) setCorrectedDisasterType("");
                    }}
                  />
                  <label 
                    htmlFor="include-disaster" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include disaster type correction
                  </label>
                </div>
                
                {includeDisasterType && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Current Disaster Type</h3>
                        <div className="px-3 py-2 bg-amber-50 text-amber-700 rounded border border-amber-200">
                          {originalDisasterType === "UNKNOWN" || originalDisasterType === "Not Specified" 
                            ? "Not detected" 
                            : originalDisasterType}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Corrected Disaster Type</h3>
                        <Select value={correctedDisasterType} onValueChange={setCorrectedDisasterType}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select disaster type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Disaster Types</SelectLabel>
                              {disasterTypeOptions.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={verifyWithQuiz} 
            disabled={
              isSubmitting || 
              (!correctedSentiment && !includeLocation && !includeDisasterType) ||
              (correctedSentiment ? !validateSentimentChange().valid : false)
            }
            className={`
              bg-gradient-to-r 
              ${correctedSentiment && !validateSentimentChange().valid 
                ? "from-red-500 to-red-700 opacity-70" 
                : "from-indigo-600 to-purple-600"
              }
            `}
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
            {!isSubmitting && <ThumbsUp className="ml-2 h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}