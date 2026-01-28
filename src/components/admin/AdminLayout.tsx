import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, ShoppingBag, Users, Settings, LogOut, MessageSquare, Handshake, Image, ExternalLink, Phone, Menu, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const [open, setOpen] = useState(false);

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
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-100">
                <h1 className="text-2xl font-bold text-primary font-heading">Dišpet Admin</h1>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path ||
                        (item.path !== "/admin" && location.pathname.startsWith(item.path));

                    return (
                        <Link key={item.path} to={item.path} onClick={() => setOpen(false)}>
                            <div className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                                isActive
                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                            )}>
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100 space-y-2">
                <Button variant="outline" className="w-full justify-start gap-3" asChild>
                    <Link to="/">
                        <ExternalLink className="w-5 h-5" />
                        View Site
                    </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 gap-3">
                    <LogOut className="w-5 h-5" />
                    Logout
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <SidebarContent />
            </aside>

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-primary font-heading">Dišpet Admin</h1>
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64 bg-white">
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto w-full">
                    <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-[100vw] overflow-x-hidden">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
