import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

loadFont({
  family: "Kaushan Script",
  url: staticFile("fonts/KaushanScript-Regular.ttf"),
});
loadFont({
  family: "Manrope",
  url: staticFile("fonts/Manrope-VF.ttf"),
  weight: "200 800",
});

export const colors = {
  cream: "#fff4e4",
  coral: "#f0485a",
  amber: "#f2a24a",
  night: "#12141c",
};

export const fonts = {
  brush: '"Kaushan Script", cursive',
  sans: '"Manrope", system-ui, sans-serif',
};

// Shared photo grade: faded, warm and slightly lifted, like the reference reel
export const photoFilter = "saturate(0.88) contrast(0.97) brightness(1.03) sepia(0.1)";
