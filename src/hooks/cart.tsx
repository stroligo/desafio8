import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsFromStorage = await AsyncStorage.getItem('products');
      if (productsFromStorage) {
        setProducts(JSON.parse(productsFromStorage));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const productAlreadyInCart = products.find(
        curr => curr.id === product.id,
      );
      if (productAlreadyInCart) {
        productAlreadyInCart.quantity += 1; // product.quantity;
        setProducts(oldProducts => [...oldProducts]);
        return;
      }

      setProducts(oldProducts => [...oldProducts, { ...product, quantity: 1 }]);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productFound = products.find(curr => curr.id === id);
      if (productFound) {
        productFound.quantity += 1;
        setProducts(oldProducts => [...oldProducts]);
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productFound = products.find(curr => curr.id === id);
      if (productFound) {
        productFound.quantity -= 1;
        if (productFound.quantity > 0) {
          setProducts(oldProducts => [...oldProducts]);
        } else {
          setProducts(oldProducts =>
            oldProducts.filter(product => product.id !== id),
          );
        }
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
