const getDistanceBetweenTwoPoints = (
  pos1: { x: number; y: number },
  pos2: { x: number; y: number }
): number => {
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
};

export default getDistanceBetweenTwoPoints;
