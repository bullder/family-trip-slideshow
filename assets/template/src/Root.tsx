import { Composition } from "remotion";
import { Slideshow } from "./Slideshow";
import { VerticalSlideshow } from "./vertical/VerticalSlideshow";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* TV / messenger cut */}
      <Composition id="Slideshow" component={Slideshow} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
      {/* Instagram Reels cut: same story and beat grid, re-composed for 9:16 */}
      <Composition id="SlideshowVertical" component={VerticalSlideshow} durationInFrames={TOTAL_FRAMES} fps={FPS} width={HEIGHT} height={WIDTH} />
    </>
  );
};
