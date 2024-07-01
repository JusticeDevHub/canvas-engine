import CanvasObject, { movementInterface } from "../lib/CanvasObject";

const moveToPositionLoop = (
  _this: CanvasObject,
  targetX: number,
  targetY: number,
  moveToPositionData: movementInterface,
  timeTillDestination: number
) => {
  const timepassed = (Date.now() - (moveToPositionData?.timestamp ?? 0)) / 1000;

  if (timepassed > timeTillDestination) {
    _this.setPosition(targetX, targetY);
    return;
  }

  const currentPosition = {
    x:
      (moveToPositionData?.startX ?? 0) +
      (((moveToPositionData?.targetX ?? 0) -
        (moveToPositionData?.startX ?? 0)) *
        timepassed) /
        timeTillDestination,
    y:
      (moveToPositionData?.startY ?? 0) +
      (((moveToPositionData?.targetY ?? 0) -
        (moveToPositionData?.startY ?? 0)) *
        timepassed) /
        timeTillDestination,
  };

  _this.setPosition(currentPosition.x, currentPosition.y);

  if (moveToPositionData) {
    moveToPositionData.loopId = requestAnimationFrame(() => {
      moveToPositionLoop(
        _this,
        targetX,
        targetY,
        moveToPositionData,
        timeTillDestination
      );
    });
  }
};

export default moveToPositionLoop;
