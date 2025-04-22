import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import GeographicAnalysis from "@/pages/geographic-analysis";
import Timeline from "@/pages/timeline";
import Comparison from "@/pages/comparison";
import RawData from "@/pages/raw-data";
import Evaluation from "@/pages/evaluation";
import RealTime from "@/pages/real-time";
import NewsMonitoring from "@/pages/news-monitoring";
import About from "@/pages/about";
import { DisasterContextProvider } from "@/context/disaster-context";
import { TutorialProvider } from "@/context/tutorial-context";
import { MainLayout } from "@/components/layout/main-layout";
import { UploadProgressModal } from "@/components/upload-progress-modal";

function Router() {
  const [location] = useLocation();
  const isLandingPage = location === "/";
  
  // Determine if we should show the dashboard layout
  const showDashboardLayout = !isLandingPage;
  
  // Return early for landing page without MainLayout
  if (isLandingPage) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  // Regular dashboard routes with MainLayout
  return (
    <MainLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/geographic-analysis" component={GeographicAnalysis} />
        {/* Keep the old route for backward compatibility */}
        <Route path="/emotion-analysis" component={GeographicAnalysis} />
        <Route path="/timeline" component={Timeline} />
        <Route path="/comparison" component={Comparison} />
        <Route path="/raw-data" component={RawData} />
        <Route path="/evaluation" component={Evaluation} />
        <Route path="/real-time" component={RealTime} />
        <Route path="/news-monitoring" component={NewsMonitoring} />
        <Route path="/about" component={About} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TutorialProvider>
        <DisasterContextProvider>
          {/* Global upload progress modal to ensure it stays visible across all pages */}
          <UploadProgressModal />
          <Router />
          <Toaster />
        </DisasterContextProvider>
      </TutorialProvider>
    </QueryClientProvider>
  );
}

export default App;