import React from "react";
import { Composition } from "remotion";
import { VedicScanAd } from "./VedicScanAd";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="VedicScanAd"
      component={VedicScanAd}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{}}
    />
  );
};
