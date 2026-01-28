import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, ShoppingBag, Users, Settings, LogOut, MessageSquare, Handshake, Image, ExternalLink, Phone, Menu, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLogin } from "@/pages/admin/AdminLogin";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    const { user, logout, isAuthenticated } = useAuth();
    const location = useLocation();
    const [open, setOpen] = useState(false);

    if (!isAuthenticated || user?.role !== 'admin') {
        return <AdminLogin />;
    }

    const menuItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
        { icon: FileText, label: "Blog", path: "/admin/posts" },
        { icon: ShoppingBag, label: "Products", path: "/admin/products" },
        { icon: MessageSquare, label: "Messages", path: "/admin/messages" },
        { icon: Image, label: "Gallery", path: "/admin/gallery" },
        { icon: Users, label: "Users", path: "/admin/users" },
        { icon: Handshake, label: "Partners", path: "/admin/partners" },
        { icon: Phone, label: "Contact Info", path: "/admin/contact" },
        { icon: Share2, label: "Social Media", path: "/admin/social" },
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-gradient-to-br from-[#0044bf] to-[#ad00e9]">
            <div className="p-8 border-b border-white/20">
                <Link to="/admin" onClick={() => setOpen(false)} className="block group">
                    <h1 className="text-3xl font-black text-white font-heading tracking-tighter flex items-center gap-2 group-hover:scale-105 transition-transform duration-300">
                        DIŠPET <span className="text-cyan-300 drop-shadow-lg">ADMIN</span>
                    </h1>
                </Link>
            </div>

            <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto">
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-4 ml-4">Main Menu</p>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path ||
                        (item.path !== "/admin" && location.pathname.startsWith(item.path));

                    return (
                        <Link key={item.path} to={item.path} onClick={() => setOpen(false)}>
                            <div className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-300 font-semibold text-sm",
                                isActive
                                    ? "bg-white text-[#0044bf] shadow-xl scale-105"
                                    : "text-white/90 hover:bg-white/20 hover:text-white hover:scale-105"
                            )}>
                                <div className={cn(
                                    "p-1.5 rounded-full transition-colors",
                                    isActive ? "bg-[#0044bf]/20" : "bg-white/20"
                                )}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                {item.label}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-white/20 space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3 rounded-full border-2 border-white/30 bg-white/10 text-white hover:bg-white hover:text-[#0044bf] transition-all font-semibold backdrop-blur-sm" asChild>
                    <Link to="/">
                        <ExternalLink className="w-4 h-4" />
                        View Website
                    </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-white/90 hover:text-white hover:bg-white/20 rounded-full gap-3 font-semibold" onClick={logout}>
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gradient-to-br from-pink-50 via-cyan-50 to-yellow-50">
            {/* Desktop Sidebar */}
            <aside className="w-72 hidden lg:flex flex-col z-40 shadow-2xl">
                <SidebarContent />
            </aside>

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Mobile Header (Sticky & Glassy) */}
                <header className="lg:hidden sticky top-0 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 p-4 flex items-center justify-between z-30 shadow-medium">
                    <Link to="/admin">
                        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent font-heading tracking-tighter">
                            DIŠPET <span className="text-yellow-500">ADMIN</span>
                        </h1>
                    </Link>
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full shadow-medium border-2 border-primary/20">
                                <Menu className="w-5 h-5 text-primary" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-72 border-r-0">
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto w-full scroll-smooth">
                    <div className="max-w-[1600px] mx-auto p-5 md:p-10 lg:p-12 pb-24 lg:pb-12">
                        {children}
                    </div>
                </main>

                {/* Bottom padding helper for mobile */}
                <div className="lg:hidden h-px w-full" />
            </div>
        </div>
    );
};

export default AdminLayout;
