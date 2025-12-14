/**
 * Site Map Configuration Types
 *
 * Canonical type definitions for site map configuration.
 * Used by frontend, tracking-service, and any other services.
 */
/**
 * Type guard to check if obstacle is a rectangle
 */
export function isRectangleObstacle(obstacle) {
    return obstacle.type === 'rectangle';
}
/**
 * Type guard to check if obstacle is a circle
 */
export function isCircleObstacle(obstacle) {
    return obstacle.type === 'circle';
}
/**
 * Type guard to check if obstacle is a polygon
 */
export function isPolygonObstacle(obstacle) {
    return obstacle.type === 'polygon';
}
//# sourceMappingURL=sitemap.js.map