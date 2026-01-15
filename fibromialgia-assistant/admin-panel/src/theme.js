// Configuração de tema para Tailwind CSS
// Este arquivo define variáveis e configurações de tema que podem ser reutilizadas

// Cores primárias e secundárias que correspondem às anteriormente definidas no Material UI
const colors = {
  brand: {
    50: "#e3f2fd",
    100: "#bbdefb",
    200: "#90caf9",
    300: "#64b5f6",
    400: "#42a5f5",
    500: "#1976d2", // Cor principal do tema anterior
    600: "#1565c0",
    700: "#0d47a1",
    800: "#0a2c5d",
    900: "#051f45",
  },
  secondary: {
    50: "#fce4ec",
    100: "#f8bbd0",
    200: "#f48fb1",
    300: "#f06292",
    400: "#ec407a",
    500: "#dc004e", // Cor secundária do tema anterior
    600: "#c2185b",
    700: "#ad1457",
    800: "#880e4f",
    900: "#560027",
  },
};

export default {
  colors,
  fontFamily: {
    sans: [
      "Roboto",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Arial",
      "sans-serif",
    ].join(","),
  },
};
