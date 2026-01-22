import ScrollToTop from "./components/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import AdminLayout from "./components/admin/AdminLayout";
import Index from "./pages/Index";
import Games from "./pages/Games";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import Account from "./pages/Account";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import AdminPosts from "./pages/admin/Posts";
import AdminProducts from "./pages/admin/Products";
import ProductFormPage from "./pages/admin/ProductFormPage";
import AdminUsers from "./pages/admin/Users";
import AdminPartners from "./pages/admin/Partners";
import AdminGallery from "./pages/admin/Gallery";
import AdminContact from "./pages/admin/Contact";
import AdminMessages from "./pages/admin/Messages";
import AdminSettings from "./pages/admin/Settings";
import NotFound from "./pages/NotFound";

import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";

import Social from "./pages/admin/Social";
import { CookieBanner } from "@/components/CookieBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <CookieBanner />
            <Routes>
              {/* Public Routes */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/games" element={<Games />} />
                <Route path="/shop" element={<Shop />} />
                {/* ProductDetail route removed as it is now integrated into Shop.tsx */}
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
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
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
