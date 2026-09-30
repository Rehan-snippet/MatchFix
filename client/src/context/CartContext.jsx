import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'matchfix_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  function showToast(message, type = 'success') {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 3000);
  }

  function addToCart(product, quantity = 1) {
    const qty = Math.max(1, Number(quantity) || 1);
    let addedItemTitle = product.title;

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.product_id === product.product_id);
      if (existingIdx > -1) {
        const next = [...prev];
        const currentItem = next[existingIdx];
        const maxStock = product.stock ?? currentItem.stock;
        const targetQty = currentItem.qty + qty;
        const finalQty = maxStock ? Math.min(targetQty, maxStock) : targetQty;

        next[existingIdx] = {
          ...currentItem,
          qty: finalQty,
          stock: maxStock ?? currentItem.stock,
          price: Number(product.price ?? currentItem.price),
        };
        return next;
      }

      const coverImg =
        product.cover_image ||
        (product.images && product.images.length > 0 ? product.images[0].url : '') ||
        'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=400&q=80';

      return [
        ...prev,
        {
          product_id: product.product_id,
          title: product.title,
          price: Number(product.price),
          qty: product.stock ? Math.min(qty, product.stock) : qty,
          stock: product.stock ?? 999,
          cover_image: coverImg,
          shop_name: product.shop_name || 'MatchFix Merchant',
          category: product.category || 'Gear',
          condition: product.condition || 'new',
        },
      ];
    });

    showToast(`Added "${addedItemTitle}" to cart.`);
  }

  function removeFromCart(productId) {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }

  function updateQty(productId, quantity) {
    const qty = Number(quantity);
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.product_id !== productId) return i;
        const clampedQty = i.stock ? Math.min(qty, i.stock) : qty;
        return { ...i, qty: clampedQty };
      })
    );
  }

  function clearCart() {
    setItems([]);
  }

  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);
  const cartSubtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartCount,
        cartSubtotal,
        notification,
        dismissNotification: () => setNotification(null),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
