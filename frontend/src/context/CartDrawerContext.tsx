import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

type CartDrawerContextValue = {
  isOpen: boolean;
  isManaged: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
};

const CartDrawerContext = createContext<CartDrawerContextValue>({
  isOpen: false,
  isManaged: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
});

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);
  const toggleDrawer = useCallback(() => setIsOpen((prev) => !prev), []);

  const value = useMemo<CartDrawerContextValue>(
    () => ({
      isOpen,
      isManaged: true,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    }),
    [isOpen, openDrawer, closeDrawer, toggleDrawer]
  );

  return (
    <CartDrawerContext.Provider value={value}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer(): CartDrawerContextValue {
  return useContext(CartDrawerContext);
}
