import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { PWABottomButton } from "@/components/PWABottomButton";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { lazy, Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import CookieConsent from "@/components/CookieConsent";

// Layout components (small, always needed — eager loaded)
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/DashboardLayout";
import UserDashboardLayout from "./components/UserDashboardLayout";
import AdminDashboardLayout from "./components/AdminDashboardLayout";

// Eagerly loaded: shell pages shown on first paint
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazily loaded: everything else
const ResetPassword      = lazy(() => import("./pages/ResetPassword"));
const UserDashboard      = lazy(() => import("./pages/UserDashboard"));
const Dashboard          = lazy(() => import("./pages/Dashboard"));
const KivroAddresses     = lazy(() => import("./pages/KivroAddresses"));
const PackageTracking    = lazy(() => import("./pages/PackageTracking"));
const Inbox              = lazy(() => import("./pages/Inbox"));
const InboxMessageDetail = lazy(() => import("./pages/InboxMessageDetail"));
const Receipts           = lazy(() => import("./pages/Receipts"));
const ReceiptDetails     = lazy(() => import("./pages/ReceiptDetails"));
const Shared             = lazy(() => import("./pages/Shared"));
const UserPayments       = lazy(() => import("./pages/UserPayments"));
const UserSettings       = lazy(() => import("./pages/UserSettings"));
const UserNotifications  = lazy(() => import("./pages/UserNotifications"));
const AdminDashboardReal = lazy(() => import("./pages/admin/AdminDashboardReal"));
const UserManagement     = lazy(() => import("./pages/admin/UserManagement"));
const AddressManagement  = lazy(() => import("./pages/admin/AddressManagement"));
const PackageManagement  = lazy(() => import("./pages/admin/PackageManagement"));
const Payments           = lazy(() => import("./pages/admin/Payments"));
const GovernmentServices = lazy(() => import("./pages/admin/GovernmentServices"));
const SystemAnalytics    = lazy(() => import("./pages/admin/SystemAnalytics"));
const SecurityCenter     = lazy(() => import("./pages/admin/SecurityCenter"));
const SystemSettings     = lazy(() => import("./pages/admin/SystemSettings"));
const Notifications      = lazy(() => import("./pages/admin/Notifications"));
const HowItWorks         = lazy(() => import("./pages/HowItWorks"));
const Pricing            = lazy(() => import("./pages/Pricing"));
const ForCouriers        = lazy(() => import("./pages/ForCouriers"));
const ApiDocs            = lazy(() => import("./pages/ApiDocs"));
const HelpCenter         = lazy(() => import("./pages/HelpCenter"));
const Contact            = lazy(() => import("./pages/Contact"));
const Privacy            = lazy(() => import("./pages/Privacy"));
const Terms              = lazy(() => import("./pages/Terms"));
const DeliverySetup      = lazy(() => import("./pages/DeliverySetup"));
const CreateKivroAddress = lazy(() => import("./pages/CreateKivroAddress"));
const MapView            = lazy(() => import("./pages/MapView"));
const CourierDashboard   = lazy(() => import("./pages/CourierDashboard"));
const PublicAddressView  = lazy(() => import("./pages/PublicAddressView"));
const KivroPinDemo       = lazy(() => import("./pages/KivroPinDemo"));
const PinResolver        = lazy(() => import("./pages/PinResolver"));
const BusinessOnboarding = lazy(() => import("./pages/BusinessOnboarding"));
const ResellerPortal     = lazy(() => import("./pages/ResellerPortal"));
const Subscription       = lazy(() => import("./pages/Subscription"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TenantProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWABottomButton />
        <PWAUpdatePrompt />
        <BrowserRouter>
          <CookieConsent />
          <ErrorBoundary>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            {/* Admin authentication route */}
            <Route path="/admin/auth" element={<Auth />} />
            {/* OAuth callback route - redirects after Google sign-in */}
            <Route path="/auth/callback" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/couriers" element={<ForCouriers />} />
            <Route path="/api" element={<ApiDocs />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/delivery-setup" element={<DeliverySetup />} />
            <Route path="/create-address" element={<CreateKivroAddress />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/courier-dashboard" element={<CourierDashboard />} />
            {/* Public address view for drivers/couriers */}
            <Route path="/kv/:shareToken" element={<PublicAddressView />} />
            {/* PIN resolver - converts KIVRO PIN to map view */}
            <Route path="/pin/:shortCode" element={<PinResolver />} />
            {/* KIVRO PIN Integration Demo for E-Commerce */}
            <Route path="/pin-demo" element={<KivroPinDemo />} />
            <Route path="/overview" element={<Dashboard />} />
            <Route path="/business" element={<BusinessOnboarding />} />
            <Route path="/reseller" element={<ResellerPortal />} />
            <Route path="/dashboard" element={<UserDashboardLayout />}>
              <Route index element={<UserDashboard />} />
              <Route path="addresses" element={<KivroAddresses />} />
              <Route path="inbox" element={<Inbox />} />
              <Route path="inbox/:messageId" element={<InboxMessageDetail />} />
              <Route path="payments" element={<UserPayments />} />
              <Route path="receipts" element={<Receipts />} />
              <Route path="receipts/:id" element={<ReceiptDetails />} />
              <Route path="shared" element={<Shared />} />
              <Route path="notifications" element={<UserNotifications />} />
              <Route path="settings" element={<UserSettings />} />
              <Route path="subscription" element={<Subscription />} />
            </Route>
            <Route path="/admin" element={<AdminDashboardLayout />}>
              <Route index element={<AdminDashboardReal />} />
              <Route path="dashboard" element={<AdminDashboardReal />} />
              <Route path="addresses" element={<AddressManagement />} />
              <Route path="track" element={<PackageTracking />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="packages" element={<PackageManagement />} />
              <Route path="payments" element={<Payments />} />
              <Route path="services" element={<GovernmentServices />} />
              <Route path="analytics" element={<SystemAnalytics />} />
              <Route path="security" element={<SecurityCenter />} />
              <Route path="settings" element={<SystemSettings />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
      </TenantProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
