import { describe, it, expect, beforeEach } from 'vitest';
import { useWallEditor } from '../useWallEditor';
import type { Wall } from '../../stores/siteMaps';

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
      const mockWall: Wall = {
        id: 'test-wall',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 100 },
        type: 'internal',
        thickness: 4,
      };

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
      expect(wall?.start).toEqual({ x: 100, y: 200 });
      expect(wall?.end).toEqual({ x: 200, y: 300 });
      expect(wall?.type).toBe('external');
      expect(wall?.thickness).toBe(6);
      expect(wall?.id).toMatch(/^wall-\d+$/);

      // Drawing state should be reset
      expect(wallEditor.drawState.value.isDrawing).toBe(false);
      expect(wallEditor.drawState.value.startPoint).toBeNull();
    });

    it('should reject walls shorter than 10 pixels', () => {
      wallEditor.setMode('draw');
      wallEditor.startDrawing(100, 100);
      wallEditor.updateDrawing(105, 105); // ~7 pixels distance

      const wall = wallEditor.finishDrawing();

      expect(wall).toBeNull();
      expect(wallEditor.drawState.value.isDrawing).toBe(false);
    });

    it('should accept walls exactly 10 pixels or longer', () => {
      wallEditor.setMode('draw');
      wallEditor.startDrawing(0, 0);
      wallEditor.updateDrawing(10, 0); // Exactly 10 pixels

      const wall = wallEditor.finishDrawing();

      expect(wall).not.toBeNull();
      expect(wall?.start).toEqual({ x: 0, y: 0 });
      expect(wall?.end).toEqual({ x: 10, y: 0 });
    });
  });

  describe('Wall Detection', () => {
    const testWalls: Wall[] = [
      {
        id: 'wall-1',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        type: 'internal',
        thickness: 4,
      },
      {
        id: 'wall-2',
        start: { x: 50, y: 50 },
        end: { x: 150, y: 50 },
        type: 'external',
        thickness: 8,
      },
    ];

    it('should find wall at point within tolerance', () => {
      // Point very close to wall-1 (horizontal line at y=0)
      const wall = wallEditor.findWallAtPoint(50, 5, testWalls);
      expect(wall?.id).toBe('wall-1');
    });

    it('should not find wall at point outside tolerance', () => {
      // Point too far from any wall
      const wall = wallEditor.findWallAtPoint(50, 50, testWalls);
      expect(wall).toBeDefined();
      expect(wall?.id).toBe('wall-2');

      const noWall = wallEditor.findWallAtPoint(200, 200, testWalls);
      expect(noWall).toBeNull();
    });

    it('should use wall thickness in hit detection', () => {
      // wall-2 has thickness 8, so tolerance is 8 + 5 = 13
      const wall = wallEditor.findWallAtPoint(50, 62, testWalls);
      expect(wall?.id).toBe('wall-2');

      const noWall = wallEditor.findWallAtPoint(50, 65, testWalls);
      expect(noWall).toBeNull();
    });
  });

  describe('Grid Snapping', () => {
    it('should snap to grid with default 50px grid size', () => {
      const snapped = wallEditor.snapPoint(123, 167, []);
      expect(snapped).toEqual({ x: 100, y: 150 });
    });

    it('should snap to grid with custom grid size', () => {
      wallEditor.setSnapOptions({ gridSize: 25 });
      const snapped = wallEditor.snapPoint(123, 167, []);
      expect(snapped).toEqual({ x: 125, y: 175 });
    });

    it('should not snap when grid snapping is disabled', () => {
      wallEditor.setSnapOptions({ snapToGrid: false, snapToWalls: false });
      const snapped = wallEditor.snapPoint(123, 167, []);
      expect(snapped).toEqual({ x: 123, y: 167 });
    });
  });

  describe('Wall Endpoint Snapping', () => {
    const testWalls: Wall[] = [
      {
        id: 'wall-1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 100 },
        type: 'internal',
        thickness: 4,
      },
    ];

    it('should snap to nearby wall endpoint within threshold', () => {
      const snapped = wallEditor.snapPoint(105, 103, testWalls);
      expect(snapped).toEqual({ x: 100, y: 100 }); // Snapped to start
    });

    it('should prioritize wall snapping over grid snapping', () => {
      // Point that would snap to (100, 100) via grid, but is near (200, 100) endpoint
      wallEditor.setSnapOptions({ snapToWalls: true, snapToGrid: true, gridSize: 50 });
      const snapped = wallEditor.snapPoint(197, 103, testWalls);

      // Should snap to wall endpoint, not grid
      expect(snapped).toEqual({ x: 200, y: 100 });
    });

    it('should not snap to endpoints outside threshold', () => {
      const snapped = wallEditor.snapPoint(115, 100, testWalls);
      // Should fall back to grid snapping
      expect(snapped).toEqual({ x: 100, y: 100 });
    });

    it('should not snap to walls when disabled', () => {
      wallEditor.setSnapOptions({ snapToWalls: false, snapToGrid: true });
      const snapped = wallEditor.snapPoint(105, 103, testWalls);
      // Should snap to grid, not wall endpoint
      expect(snapped).toEqual({ x: 100, y: 100 });
    });
  });

  describe('Endpoint Detection', () => {
    const testWall: Wall = {
      id: 'wall-1',
      start: { x: 100, y: 100 },
      end: { x: 200, y: 200 },
      type: 'internal',
      thickness: 4,
    };

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
    const testWall: Wall = {
      id: 'wall-1',
      start: { x: 100, y: 100 },
      end: { x: 200, y: 200 },
      type: 'internal',
      thickness: 4,
    };

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
      expect(updatedWall?.start).toEqual({ x: 150, y: 150 });
      expect(updatedWall?.end).toEqual({ x: 200, y: 200 });
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
    const testWalls: Wall[] = [
      {
        id: 'wall-1',
        start: { x: 100, y: 100 },
        end: { x: 200, y: 100 },
        type: 'internal',
        thickness: 4,
      },
    ];

    it('should update hover state in edit mode', () => {
      wallEditor.updateHoverState(105, 105, testWalls, true);

      expect(wallEditor.hoverState.value.hoveredWall?.id).toBe('wall-1');
      expect(wallEditor.hoverState.value.hoveredPart).toBe('start');
    });

    it('should detect wall body when not near endpoint', () => {
      wallEditor.updateHoverState(150, 100, testWalls, true);

      expect(wallEditor.hoverState.value.hoveredWall?.id).toBe('wall-1');
      expect(wallEditor.hoverState.value.hoveredPart).toBe('body');
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
