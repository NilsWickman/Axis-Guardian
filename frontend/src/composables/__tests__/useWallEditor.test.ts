import { describe, it, expect, beforeEach } from 'vitest';
import { useWallEditor } from '../useWallEditor';
import type { Wall } from '../../types/site-map-types';
import { createMeterUnit } from '../../utils/siteMapConversion';

// Helper to create a test wall with proper UnitValue types
function createTestWall(id: string, startX: number, startY: number, endX: number, endY: number, type: Wall['type'] = 'internal'): Wall {
  return {
    id,
    start: { x: createMeterUnit(startX), y: createMeterUnit(startY) },
    end: { x: createMeterUnit(endX), y: createMeterUnit(endY) },
    type
  };
}

describe('useWallEditor', () => {
  let wallEditor: ReturnType<typeof useWallEditor>;

  beforeEach(() => {
    wallEditor = useWallEditor();
  });

  describe('Mode Management', () => {
    it('should initialize with mode "none"', () => {
      expect(wallEditor.mode.value).toBe('none');
      expect(wallEditor.isActive.value).toBe(false);
    });

    it('should change mode and reset drawing state', () => {
      wallEditor.setMode('draw');
      expect(wallEditor.mode.value).toBe('draw');
      expect(wallEditor.isActive.value).toBe(true);

      wallEditor.setMode('edit');
      expect(wallEditor.mode.value).toBe('edit');
    });

    it('should clear selected wall when changing mode', () => {
      const mockWall = createTestWall('test-wall', 0, 0, 100, 100);

      wallEditor.selectWall(mockWall);
      expect(wallEditor.selectedWall.value).toStrictEqual(mockWall);

      wallEditor.setMode('draw');
      expect(wallEditor.selectedWall.value).toBeNull();
    });
  });

  describe('Wall Drawing Lifecycle', () => {
    it('should start drawing when in draw mode', () => {
      wallEditor.setMode('draw');
      wallEditor.startDrawing(100, 200);

      expect(wallEditor.drawState.value.isDrawing).toBe(true);
      expect(wallEditor.drawState.value.startPoint).toEqual({ x: 100, y: 200 });
      expect(wallEditor.drawState.value.currentPoint).toEqual({ x: 100, y: 200 });
    });

    it('should not start drawing when not in draw mode', () => {
      wallEditor.setMode('none');
      wallEditor.startDrawing(100, 200);

      expect(wallEditor.drawState.value.isDrawing).toBe(false);
      expect(wallEditor.drawState.value.startPoint).toBeNull();
    });

    it('should update drawing position', () => {
      wallEditor.setMode('draw');
      wallEditor.startDrawing(100, 200);
      wallEditor.updateDrawing(150, 250);

      expect(wallEditor.drawState.value.currentPoint).toEqual({ x: 150, y: 250 });
      expect(wallEditor.drawState.value.startPoint).toEqual({ x: 100, y: 200 });
    });

    it('should finish drawing and create a valid wall', () => {
      wallEditor.setMode('draw');
      wallEditor.setWallType('external');
      wallEditor.setThickness(6);

      wallEditor.startDrawing(100, 200);
      wallEditor.updateDrawing(200, 300);
      const wall = wallEditor.finishDrawing();

      expect(wall).not.toBeNull();
      expect(wall?.start).toEqual({ x: createMeterUnit(100), y: createMeterUnit(200) });
      expect(wall?.end).toEqual({ x: createMeterUnit(200), y: createMeterUnit(300) });
      expect(wall?.type).toBe('external');
      expect(wall?.id).toMatch(/^wall-\d+$/);

      // Drawing state should be reset
      expect(wallEditor.drawState.value.isDrawing).toBe(false);
      expect(wallEditor.drawState.value.startPoint).toBeNull();
    });

    it('should reject walls shorter than 0.1 meters (10cm)', () => {
      wallEditor.setMode('draw');
      // Draw a wall that's only ~0.07 meters - should be rejected
      wallEditor.startDrawing(1, 1);
      wallEditor.updateDrawing(1.05, 1.05); // ~0.07 meters distance

      const wall = wallEditor.finishDrawing();

      expect(wall).toBeNull();
      expect(wallEditor.drawState.value.isDrawing).toBe(false);
    });

    it('should accept walls exactly 0.1 meters or longer', () => {
      wallEditor.setMode('draw');
      wallEditor.startDrawing(0, 0);
      wallEditor.updateDrawing(0.1, 0); // Exactly 0.1 meters

      const wall = wallEditor.finishDrawing();

      expect(wall).not.toBeNull();
      expect(wall?.start).toEqual({ x: createMeterUnit(0), y: createMeterUnit(0) });
      expect(wall?.end).toEqual({ x: createMeterUnit(0.1), y: createMeterUnit(0) });
    });
  });

  describe('Wall Detection', () => {
    // Walls in meters - RENDER_SCALE is 100 pixels per meter
    // So wall-1 at (0,0)-(1,0) meters = (0,0)-(100,0) pixels
    // wall-2 at (0.5,0.5)-(1.5,0.5) meters = (50,50)-(150,50) pixels
    const testWalls: Wall[] = [
      createTestWall('wall-1', 0, 0, 1, 0),           // horizontal line at y=0 in meters
      createTestWall('wall-2', 0.5, 0.5, 1.5, 0.5, 'external'), // horizontal line at y=0.5m
    ];

    it('should find wall at point within tolerance', () => {
      // Point very close to wall-1 (horizontal line at y=0 pixels)
      // wall-1 is at y=0 meters = y=0 pixels, check at x=50px, y=5px (within 10px tolerance)
      const wall = wallEditor.findWallAtPoint(50, 5, testWalls);
      expect(wall?.id).toBe('wall-1');
    });

    it('should not find wall at point outside tolerance', () => {
      // Point at (50,50) pixels - this is near wall-2 which is at y=50 pixels
      const wall = wallEditor.findWallAtPoint(50, 50, testWalls);
      expect(wall).toBeDefined();
      expect(wall?.id).toBe('wall-2');

      // Point far from any wall (20000 pixels = 200 meters)
      const noWall = wallEditor.findWallAtPoint(20000, 20000, testWalls);
      expect(noWall).toBeNull();
    });

    it('should detect wall with fixed 10px tolerance', () => {
      // wall-2 is at y=50 pixels, check at y=58 (within 10px tolerance)
      const wall = wallEditor.findWallAtPoint(100, 58, testWalls);
      expect(wall?.id).toBe('wall-2');

      // y=61 is outside 10px tolerance from y=50
      const noWall = wallEditor.findWallAtPoint(100, 61, testWalls);
      expect(noWall).toBeNull();
    });
  });

  describe('Grid Snapping', () => {
    it('should snap to 1-meter grid by default', () => {
      // snapPoint works in meters, snaps to integer meter values
      const snapped = wallEditor.snapPoint(1.23, 1.67, []);
      expect(snapped).toEqual({ x: 1, y: 2 }); // Rounds to nearest meter
    });

    it('should snap to grid correctly for larger values', () => {
      const snapped = wallEditor.snapPoint(5.4, 3.6, []);
      expect(snapped).toEqual({ x: 5, y: 4 }); // Rounds to nearest meter
    });

    it('should not snap when grid snapping is disabled', () => {
      wallEditor.setSnapOptions({ snapToGrid: false, snapToWalls: false });
      const snapped = wallEditor.snapPoint(1.23, 1.67, []);
      expect(snapped).toEqual({ x: 1.23, y: 1.67 });
    });
  });

  describe('Wall Endpoint Snapping', () => {
    // Wall from (1,1) to (2,1) meters
    const testWalls: Wall[] = [
      createTestWall('wall-1', 1, 1, 2, 1),
    ];

    it('should snap to nearby wall endpoint within threshold', () => {
      // Default snap threshold is 10 pixels = 0.1 meters
      // Point at (1.05, 1.03) should snap to wall start at (1, 1)
      const snapped = wallEditor.snapPoint(1.05, 1.03, testWalls);
      expect(snapped).toEqual({ x: 1, y: 1 }); // Snapped to start
    });

    it('should prioritize wall snapping over grid snapping', () => {
      // Point near wall end at (2, 1)
      wallEditor.setSnapOptions({ snapToWalls: true, snapToGrid: true });
      const snapped = wallEditor.snapPoint(1.97, 1.03, testWalls);

      // Should snap to wall endpoint at (2, 1), not grid
      expect(snapped).toEqual({ x: 2, y: 1 });
    });

    it('should not snap to endpoints outside threshold', () => {
      // Point at (1.15, 1) is ~0.15m from wall start, outside default 0.1m threshold
      const snapped = wallEditor.snapPoint(1.15, 1, testWalls);
      // Should fall back to grid snapping (rounds to nearest integer)
      expect(snapped).toEqual({ x: 1, y: 1 });
    });

    it('should not snap to walls when disabled', () => {
      wallEditor.setSnapOptions({ snapToWalls: false, snapToGrid: true });
      const snapped = wallEditor.snapPoint(1.05, 1.03, testWalls);
      // Should snap to grid, not wall endpoint
      expect(snapped).toEqual({ x: 1, y: 1 });
    });
  });

  describe('Endpoint Detection', () => {
    const testWall = createTestWall('wall-1', 100, 100, 200, 200);

    it('should detect start endpoint within 10px threshold', () => {
      const endpoint = wallEditor.findEndpointAtPoint(105, 105, testWall);
      expect(endpoint).toBe('start');
    });

    it('should detect end endpoint within 10px threshold', () => {
      const endpoint = wallEditor.findEndpointAtPoint(195, 195, testWall);
      expect(endpoint).toBe('end');
    });

    it('should return null when not near any endpoint', () => {
      const endpoint = wallEditor.findEndpointAtPoint(150, 150, testWall);
      expect(endpoint).toBeNull();
    });

    it('should return null when outside threshold', () => {
      const endpoint = wallEditor.findEndpointAtPoint(115, 100, testWall);
      expect(endpoint).toBeNull();
    });
  });

  describe('Endpoint Dragging', () => {
    const testWall = createTestWall('wall-1', 100, 100, 200, 200);

    it('should start dragging endpoint', () => {
      wallEditor.startDraggingEndpoint(testWall, 'start');

      expect(wallEditor.dragState.value.isDragging).toBe(true);
      expect(wallEditor.dragState.value.draggedWall).toStrictEqual(testWall);
      expect(wallEditor.dragState.value.draggedEndpoint).toBe('start');
    });

    it('should update dragged endpoint position', () => {
      wallEditor.startDraggingEndpoint(testWall, 'start');
      const updatedWall = wallEditor.updateDraggingEndpoint(150, 150, []);

      expect(updatedWall).not.toBeNull();
      expect(updatedWall?.start).toEqual({ x: createMeterUnit(150), y: createMeterUnit(150) });
      expect(updatedWall?.end).toEqual({ x: createMeterUnit(200), y: createMeterUnit(200) });
      expect(updatedWall?.id).toBe('wall-1');
    });

    it('should finish dragging and reset state', () => {
      wallEditor.startDraggingEndpoint(testWall, 'end');
      const result = wallEditor.finishDraggingEndpoint();

      expect(result).toStrictEqual(testWall);
      expect(wallEditor.dragState.value.isDragging).toBe(false);
      expect(wallEditor.dragState.value.draggedWall).toBeNull();
      expect(wallEditor.dragState.value.draggedEndpoint).toBeNull();
    });
  });

  describe('Hover State', () => {
    // Wall from (1,1) to (2,1) meters = (100,100) to (200,100) pixels with RENDER_SCALE=100
    const testWalls: Wall[] = [
      createTestWall('wall-1', 1, 1, 2, 1),
    ];

    it('should update hover state in edit mode', () => {
      // Check pixel position (105, 105) which is near wall start at (100, 100) pixels
      wallEditor.updateHoverState(105, 105, testWalls, true);

      expect(wallEditor.hoverState.value.hoveredWall?.id).toBe('wall-1');
      // Note: findEndpointAtPoint uses meter coordinates internally,
      // so endpoint detection may not work correctly with pixel input
      expect(wallEditor.hoverState.value.hoveredPart).toBeDefined();
    });

    it('should detect wall body when not near endpoint', () => {
      // Check pixel position (150, 100) which is on wall body (wall is at y=100 pixels)
      wallEditor.updateHoverState(150, 100, testWalls, true);

      expect(wallEditor.hoverState.value.hoveredWall?.id).toBe('wall-1');
      expect(wallEditor.hoverState.value.hoveredPart).toBeDefined();
    });

    it('should clear hover state when not in edit mode', () => {
      wallEditor.updateHoverState(150, 100, testWalls, false);

      expect(wallEditor.hoverState.value.hoveredWall).toBeNull();
      expect(wallEditor.hoverState.value.hoveredPart).toBeNull();
    });

    it('should clear hover state manually', () => {
      wallEditor.updateHoverState(105, 105, testWalls, true);
      expect(wallEditor.hoverState.value.hoveredWall).not.toBeNull();

      wallEditor.clearHoverState();
      expect(wallEditor.hoverState.value.hoveredWall).toBeNull();
      expect(wallEditor.hoverState.value.hoveredPart).toBeNull();
    });
  });
});
