import CanvasEngine from "../lib/CanvasEngine";

const getMousePosition = (
  canvasEngine: CanvasEngine,
  document: Document,
  mouseEvent: MouseEvent
): {
  x: number;
  y: number;
} => {
  const mousePosition = { x: 0, y: 0 };
  const cameraPosition = canvasEngine.getCameraObject().getPosition();
  const canvasElementData = document
    .getElementById(canvasEngine.getCanvasId())
    ?.getClientRects();

  if (canvasElementData && canvasElementData[0]) {
    mousePosition.x = mouseEvent.clientX - canvasElementData[0].width / 2;
    mousePosition.y =
      canvasElementData[0].height -
      mouseEvent.clientY -
      canvasElementData[0].height / 2;
    mousePosition.x += cameraPosition.x;
    mousePosition.y += cameraPosition.y;
  }

  return mousePosition;
};

export default getMousePosition;
