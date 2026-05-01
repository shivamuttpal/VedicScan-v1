import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Compatibility from "./pages/Compatibility";
import Chat from "./pages/Chat";
import Insights from "./pages/Insights";
import Pricing from "./pages/Pricing";
import BabyNaming from "./pages/BabyNaming";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/ResetPassword";
import PaymentSuccess from "./pages/PaymentSuccess";
import Subscription from "./pages/Subscription";
import { FeedbackButton } from "./components/FeedbackButton";
import { Toaster } from "./components/ui/sonner";
import { useEffect } from "react";

// Note: GlobalErrorHandler for Supabase removed

function AppRouter() {
  return (
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
