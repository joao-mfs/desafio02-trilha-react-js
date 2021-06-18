import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
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
    const storagedCart =localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productsResponse = await api.get(`/products/${productId}`);
      const stockResponse = await api.get(`/stock/${productId}`);
      const filteredCart = cart.find((product:Product)=>product.id === productId);
      if (filteredCart) {
        if (filteredCart.amount < stockResponse.data.amount) {
          const newCart = cart.map((product)=>{
            if (product.id === productId) {
              return {...product,amount:product.amount +1 };
            }
            return product
          })
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart',JSON.stringify(newCart))

        }
        else{
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
      else{
        const product = {...productsResponse.data, amount: 1}
        const newCart = [...cart,product]   
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(newCart))
        setCart(newCart);
      }
    
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (cart.find(product=>product.id === productId)) {
      const newCart = cart.filter(product => product.id!==productId) 
      localStorage.setItem('@RocketShoes:cart',JSON.stringify(newCart))
      setCart(newCart)}
      else{
        toast.error('Erro na remoção do produto');
        return
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stockResponse = await api.get(`/stock/${productId}`);
      if ( amount <= 0) return
      if ( amount <= stockResponse.data.amount) {
        const newCart = cart.map((product)=>{
          if (product.id === productId) {
            return {...product,amount:amount };
          }
          return product
        })
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(newCart))

      }
      else{
        toast.error('Quantidade solicitada fora de estoque');
      }
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
