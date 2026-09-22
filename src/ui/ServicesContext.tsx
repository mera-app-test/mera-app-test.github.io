import { createContext, useContext } from "react";
import type { AppServices } from "../application";

export const ServicesContext = createContext<AppServices | null>(null);

export function useServices(): AppServices {
  const s = useContext(ServicesContext);
  if (!s) throw new Error("ServicesContext nije postavljen");
  return s;
}
