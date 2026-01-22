import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProduct, updateProduct } from "@/integrations/wordpress/woocommerce";
import { WCProduct } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaPicker } from "./MediaPicker";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface ProductEditorProps {
    product?: WCProduct | null;
    initialImage?: string;
    onSuccess: () => void;
}

export const ProductEditor = ({ product, initialImage, onSuccess }: ProductEditorProps) => {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [regularPrice, setRegularPrice] = useState("");
    const [description, setDescription] = useState("");
    const [shortDescription, setShortDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
    const [stockStatus, setStockStatus] = useState("instock");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (product) {
            setName(product.name);
            setPrice(product.price);
            setRegularPrice(product.regular_price);
            setDescription(product.description);
            setShortDescription(product.short_description);
            setImageUrl(product.images?.[0]?.src || "");
            // Standardize existing gallery
            const images = product.images || [];
            if (images.length > 1) {
                setGalleryUrls(images.slice(1).map(img => img.src));
            } else {
                setGalleryUrls([]);
            }
            setStockStatus(product.stock_status);
        } else {
            setName("");
            setPrice("");
            setRegularPrice("");
            setDescription("");
            setShortDescription("");
            setImageUrl(initialImage || "");
            setGalleryUrls([]);
            setStockStatus("instock");
        }
    }, [product, initialImage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const allImages = [];
        if (imageUrl) allImages.push({ src: imageUrl });
        if (galleryUrls.length > 0) {
            galleryUrls.forEach(url => allImages.push({ src: url }));
        }

        const data: any = {
            name,
            regular_price: regularPrice,
            description,
            short_description: shortDescription,
            stock_status: stockStatus,
            images: allImages
        };

        if (price) {
            data.sale_price = price !== regularPrice ? price : '';
        }

        try {
            if (product) {
                await updateProduct(product.id, data);
                toast({ title: "Success", description: "Product updated successfully" });
            } else {
                await createProduct(data);
                toast({ title: "Success", description: "Product created successfully" });
            }
            onSuccess();
        } catch (error) {
            console.error("Product save error:", error);
            toast({
                title: "Error",
                description: "Failed to save product. Check permissions.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter product name"
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="regularPrice">Regular Price (€)</Label>
                    <Input
                        id="regularPrice"
                        type="number"
                        step="0.01"
                        value={regularPrice}
                        onChange={(e) => setRegularPrice(e.target.value)}
                        placeholder="0.00"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="price">Sale Price (€) (Optional)</Label>
                    <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Leave empty if no sale"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="stock">Stock Status</Label>
                <Select value={stockStatus} onValueChange={setStockStatus}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select stock status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="instock">In Stock</SelectItem>
                        <SelectItem value="outofstock">Out of Stock</SelectItem>
                        <SelectItem value="onbackorder">On Backorder</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Main Image</Label>
                <MediaPicker
                    value={imageUrl}
                    onChange={setImageUrl}
                />
            </div>

            <div className="space-y-2">
                <Label>Gallery Images</Label>
                <MediaPicker
                    value={galleryUrls}
                    onChange={setGalleryUrls}
                    multiple={true}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <ReactQuill
                    theme="snow"
                    value={shortDescription}
                    onChange={setShortDescription}
                    className="h-[150px] mb-12"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Full Description</Label>
                <ReactQuill
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    className="h-[300px] mb-12"
                />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (product ? "Update Product" : "Create Product")}
            </Button>
        </form>
    );
};
