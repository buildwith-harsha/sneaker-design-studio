import type { SneakerComponent } from "../store/DesignSlice";

export const sneakerComponent: Record<
  SneakerComponent,
  {
    label: string;
  }
> = {
  upper: {
    label: "Upper",
  },

  heel: {
    label: "Heel",
  },

  tongue: {
    label: "Tongue",
  },

  midsole: {
    label: "Midsole",
  },

  outsole: {
    label: "Outsole",
  },

  laces: {
    label: "Laces",
  },

  toe: {
    label: "Toe",
  },

  logo: {
    label: "Logo",
  },
};
