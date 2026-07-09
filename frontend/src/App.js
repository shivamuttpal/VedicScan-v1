import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { FeedbackButton } from "./components/FeedbackButton";
import { Toaster } from "./components/ui/sonner";
import VedicLoader from "./components/VedicLoader";
import { lazy, Suspense } from "react";

// Route-level code splitting: each page is loaded on demand, so the initial JS
// bundle stays small and first paint is fast even on mobile networks.
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Home = lazy(() => import("./pages/Home"));
const Profile = lazy(() => import("./pages/Profile"));
const Compatibility = lazy(() => import("./pages/Compatibility"));
const Chat = lazy(() => import("./pages/Chat"));
const Insights = lazy(() => import("./pages/Insights"));
const Pricing = lazy(() => import("./pages/Pricing"));
const BabyNaming = lazy(() => import("./pages/BabyNaming"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const VerifyOTP = lazy(() => import("./pages/VerifyOTP"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const Subscription = lazy(() => import("./pages/Subscription"));
const LegalPage = lazy(() => import("./pages/LegalPage"));

function AppRouter() {
  return (
    <Suspense fallback={<VedicLoader />}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<Home />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/compatibility" 
        element={
          <ProtectedRoute>
            <Compatibility />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/chat" 
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/insights" 
        element={
          <ProtectedRoute>
            <Insights />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/baby-naming" 
        element={
          <ProtectedRoute>
            <BabyNaming />
          </ProtectedRoute>
        } 
      />
      <Route path="/pricing" element={<Pricing />} />

      {/* Public legal / compliance pages */}
      <Route path="/privacy" element={<LegalPage slug="privacy" title="Privacy Policy" />} />
      <Route path="/terms" element={<LegalPage slug="terms" title="Terms of Service" />} />
      <Route path="/refund" element={<LegalPage slug="refund" title="Refund & Cancellation Policy" />} />
      <Route path="/data-deletion" element={<LegalPage slug="data-deletion" title="Account & Data Deletion" />} />
      <Route path="/cookies" element={<LegalPage slug="cookies" title="Cookie Policy" />} />
      <Route path="/disclaimer" element={<LegalPage slug="disclaimer" title="Disclaimer" />} />
      <Route 
        path="/subscription" 
        element={
          <ProtectedRoute>
            <Subscription />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/payment-success" 
        element={
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        } 
      />
    </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <div className="App">
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || 'dummy_client_id'}>
        <BrowserRouter>
          <AuthProvider>
            <AppRouter />
            <FeedbackButton />
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </div>
  );
}

export default App;
