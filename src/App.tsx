import ScrollToTop from "./components/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Suspense, lazy } from "react";
import MainLayout from "./components/MainLayout";
import AdminLayout from "./components/admin/AdminLayout";

// Lazy Load Pages
const Index = lazy(() => import("./pages/Index"));
const Games = lazy(() => import("./pages/Games"));
const Shop = lazy(() => import("./pages/Shop"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentFrame = lazy(() => import("./pages/PaymentFrame"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Contact = lazy(() => import("./pages/Contact"));
const Account = lazy(() => import("./pages/Account"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin - Lazy Load
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminPosts = lazy(() => import("./pages/admin/Posts"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const ProductFormPage = lazy(() => import("./pages/admin/ProductFormPage"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminPartners = lazy(() => import("./pages/admin/Partners"));
const AdminGallery = lazy(() => import("./pages/admin/Gallery"));
const AdminContact = lazy(() => import("./pages/admin/Contact"));
const AdminMessages = lazy(() => import("./pages/admin/Messages"));
const Social = lazy(() => import("./pages/admin/Social"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));

import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CookieBanner } from "@/components/CookieBanner";
import { GoogleOAuthProvider } from "@react-oauth/google";

const queryClient = new QueryClient();

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <ScrollToTop />
              <CookieBanner />
              <Suspense fallback={
                <div className="flex h-screen items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              }>
                <Routes>
                  {/* Public Routes */}
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/games" element={<Games />} />
                    <Route path="/shop" element={<Shop />} />
                    {/* ProductDetail route removed as it is now integrated into Shop.tsx */}
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/payment" element={<PaymentFrame />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>

                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminLayout><Outlet /></AdminLayout>}>
                    <Route index element={<Dashboard />} />
                    <Route path="posts" element={<AdminPosts />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<ProductFormPage />} />
                    <Route path="products/edit/:id" element={<ProductFormPage />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="partners" element={<AdminPartners />} />
                    <Route path="gallery" element={<AdminGallery />} />
                    <Route path="contact" element={<AdminContact />} />
                    <Route path="messages" element={<AdminMessages />} />
                    <Route path="social" element={<Social />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
