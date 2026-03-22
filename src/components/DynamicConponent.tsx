// src/components/DynamicComponent.tsx
import { GridBoard, TokenStore } from "react-game-ui";
import type { ComponentType } from "../types/game";

const COMPONENT_MAP: Record<string, React.FC<any>> = {
  GridBoard,
  TokenStore,
};

export const DynamicComponent = ({
  type,
  props,
}: {
  type: ComponentType;
  props: any;
}) => {
  const Component = COMPONENT_MAP[type];

  if (!Component) {
    return <div className="error">Unknown component: {type}</div>;
  }

  return <Component {...props} />;
};
