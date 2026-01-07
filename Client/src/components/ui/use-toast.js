import * as React from "react";

const ToastContext = React.createContext({ toasts: [], setToasts: () => {} });

export function useToast() {
  return React.useContext(ToastContext);
}
