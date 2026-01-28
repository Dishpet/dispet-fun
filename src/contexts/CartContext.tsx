import React, { createContext, useContext, useState, useEffect } from "react";
import { WCProduct } from "@/integrations/wordpress/types";

export interface CartItem extends WCProduct {
    quantity: number;
    cartId: string;
    selectedDesigns?: { front: string; back: string };
    selectedColor?: string;
    selectedSize?: string;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: WCProduct, quantity: number, options?: { selectedDesigns?: { front: string; back: string }; selectedColor?: string; selectedSize?: string }) => void;
    removeFromCart: (cartId: string) => void;
    updateQuantity: (cartId: string, quantity: number) => void;
    clearCart: () => void;
    cartSubtotal: number;
    shippingCost: number;
    cartTotal: number;
    cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    // Load cart from local storage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart from local storage", e);
            }
        }
    }, []);

    // Save cart to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product: WCProduct, quantity: number, options?: { selectedDesigns?: { front: string; back: string }; selectedColor?: string; selectedSize?: string }) => {
        setCartItems((prev) => {
            // Check if identical item exists
            const existingItemIndex = prev.findIndex((item) =>
                item.id === product.id &&
                item.selectedColor === options?.selectedColor &&
                item.selectedSize === options?.selectedSize &&
                JSON.stringify(item.selectedDesigns) === JSON.stringify(options?.selectedDesigns)
            );

            if (existingItemIndex > -1) {
                const newItems = [...prev];
                newItems[existingItemIndex].quantity += quantity;
                return newItems;
            }

            // Create new item with unique cartId
            return [...prev, {
                ...product,
                quantity,
                cartId: `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                selectedDesigns: options?.selectedDesigns,
                selectedColor: options?.selectedColor,
                selectedSize: options?.selectedSize
            }];
        });
    };

    const removeFromCart = (cartId: string) => {
        setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
    };

    const updateQuantity = (cartId: string, quantity: number) => {
        if (quantity < 1) return;
        setCartItems((prev) =>
            prev.map((item) =>
                item.cartId === cartId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const cartSubtotal = cartItems.reduce((total, item) => {
        const price = item.sale_price ? parseFloat(item.sale_price) : parseFloat(item.price);
        return total + price * item.quantity;
    }, 0);

    const shippingCost = cartSubtotal >= 70 ? 0 : 5;
    const cartTotal = cartSubtotal + shippingCost;
    const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartSubtotal,
                shippingCost,
                cartTotal,
                cartCount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
