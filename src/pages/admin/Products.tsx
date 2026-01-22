import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";
import { getProducts } from "@/integrations/wordpress/woocommerce";
import { wpFetch, getAuthHeaders } from "@/integrations/wordpress/client";
import { WCProduct } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const Products = () => {
    const [products, setProducts] = useState<WCProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await getProducts(1, 100);
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch products:", error);
            toast({
                title: "Error",
                description: "Failed to load products.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        try {
            await wpFetch(`/wc/v3/products/${id}?force=true`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            setProducts(products.filter(p => p.id !== id));
            toast({ title: "Success", description: "Product deleted successfully" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold font-heading">Products</h1>
                <Button onClick={() => navigate("/admin/products/new")}>
                    <Plus className="w-4 h-4 mr-2" /> New Product
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        {product.images?.[0] && (
                                            <img src={product.images[0].src} alt={product.name} className="w-12 h-12 object-cover rounded" />
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>€{product.price}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.stock_status === 'instock'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {product.stock_status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                                        >
                                            <Edit className="w-4 h-4 text-blue-500" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(product.id)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {products.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        No products found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>
        </>
    );
};

export default Products;
