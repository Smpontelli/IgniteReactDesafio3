import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify'; 
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productIsInCart = cart.find(product => product.id === productId);
      
      const {data: stock} = await api.get<Product>(`stock/${productId}`);
      
      if(!productIsInCart) {
        const {data: product} = await api.get<Product>(`products/${productId}`);
        
        if(stock.amount > 0) {
          setCart([...cart, {...product, amount: 1}]);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(
            [...cart, {...product, amount: 1}]
          ));
          toast(`Foi adicionado um ${product.title} ao carrinho`);
          return;
        }
      }

      if(productIsInCart) {

          if (stock.amount > productIsInCart.amount) {
            const updateCart = cart.map(item => item.id === productId
            ? {...item, amount: Number(item.amount) +1}
            : item)

            setCart(updateCart);

            localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
            return;
          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }
      }

    } catch {
      toast.error('Erro na adi????o do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.some(item => item.id === productId);

      if(!productExists) {
        toast.error('Erro na remo????o do produto');
        return;
      }

      const updatedCart = cart.filter(item => item.id !== productId);

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
        toast.error('Erro na remo????o do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        toast.error('Erro na altera????o de quantidade do produto');
        return;
      }
      const {data: stock} = await api.get<Product>(`stock/${productId}`);

      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const productExists = cart.some(item => item.id === productId);
      
        if(!productExists) {
          toast.error('Erro na altera????o de quantidade do produto');
          return;
        }

        const updateCart = cart.map(item => item.id === productId
          ? {...item, amount: amount}
          : item)

          setCart(updateCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
    } catch {
      toast.error('Erro na altera????o de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
