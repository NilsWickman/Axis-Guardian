#!/usr/bin/env python3
import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageColor, ImageDraw


def calculate_wall_intersection_angle(
    center_x: float, center_y: float, radius: float,
    wall_start_x: float, wall_start_y: float,
    wall_end_x: float, wall_end_y: float
) -> float | None:
  """Calculate the angle where a circle intersects a line segment."""
  dx = wall_end_x - wall_start_x
  dy = wall_end_y - wall_start_y

  fx = wall_start_x - center_x
  fy = wall_start_y - center_y

  a = dx * dx + dy * dy
  b = 2 * (fx * dx + fy * dy)
  c = fx * fx + fy * fy - radius * radius

  discriminant = b * b - 4 * a * c

  if discriminant < 0:
    return None

  sqrt_disc = math.sqrt(discriminant)
  t1 = (-b - sqrt_disc) / (2 * a)
  t2 = (-b + sqrt_disc) / (2 * a)

  valid_ts = []
  if 0 <= t1 <= 1:
    valid_ts.append(t1)
  if 0 <= t2 <= 1 and abs(t2 - t1) > 1e-9:
    valid_ts.append(t2)

  if not valid_ts:
    return None

  t = valid_ts[0]
  x = wall_start_x + t * dx
  y = wall_start_y + t * dy

  angle_rad = math.atan2(y - center_y, x - center_x)
  angle_deg = math.degrees(angle_rad)
  return ((angle_deg % 360) + 360) % 360


def resolve_angle(angle_value, arc_center: dict, outer_radius: float, walls: list[dict]) -> float:
  """Resolve an angle value, handling alignToWall references."""
  if isinstance(angle_value, (int, float)):
    return float(angle_value)

  if isinstance(angle_value, dict) and 'alignToWall' in angle_value:
    wall_id = angle_value['alignToWall']
    offset = angle_value.get('offset', 0)

    # Find the wall
    wall = None
    for w in walls:
      if w.get('id') == wall_id:
        wall = w
        break

    if not wall:
      print(f"Warning: Wall not found: {wall_id}")
      return 0

    start = wall.get('start', {})
    end = wall.get('end', {})
    center = arc_center

    calculated = calculate_wall_intersection_angle(
      float(center.get('x', 0)), float(center.get('y', 0)),
      outer_radius,
      float(start.get('x', 0)), float(start.get('y', 0)),
      float(end.get('x', 0)), float(end.get('y', 0))
    )

    if calculated is None:
      print(f"Warning: No intersection with wall: {wall_id}")
      return 0

    return calculated + offset

  return 0


def parse_args() -> argparse.Namespace:
  p = argparse.ArgumentParser(description='Render a sitemap JSON to a PNG preview.')
  p.add_argument('input', help='Path to sitemap JSON')
  p.add_argument('output', help='Path to output PNG')
  p.add_argument('--scale', type=float, default=25.0, help='Pixels per meter')
  p.add_argument('--pad', type=float, default=30.0, help='Padding in pixels')
  p.add_argument('--show-labels', action='store_true', help='Draw camera/obstacle IDs')
  return p.parse_args()


def clamp_color(color: str | None, fallback: str) -> tuple[int, int, int]:
  if not color:
    return ImageColor.getrgb(fallback)
  try:
    return ImageColor.getrgb(color)
  except Exception:
    return ImageColor.getrgb(fallback)


def rotate_point(x: float, y: float, deg: float) -> tuple[float, float]:
  r = math.radians(deg)
  c = math.cos(r)
  s = math.sin(r)
  return (x * c - y * s, x * s + y * c)


def render(sitemap: dict, out_path: Path, scale: float, pad: float, show_labels: bool) -> None:
  dims = sitemap.get('dimensions') or {}
  width_m = float(dims.get('width', 0))
  height_m = float(dims.get('height', 0))

  w_px = int(width_m * scale + 2 * pad)
  h_px = int(height_m * scale + 2 * pad)
  img = Image.new('RGB', (w_px, h_px), (255, 255, 255))
  draw = ImageDraw.Draw(img)

  def to_px(xm: float, ym: float) -> tuple[float, float]:
    x = pad + xm * scale
    y = pad + (height_m - ym) * scale
    return (x, y)

  # Obstacles (tables, pillars, seating, etc.)
  for obs in sitemap.get('obstacles', []):
    obs_type = obs.get('type')
    color = clamp_color(obs.get('color'), '#cbd5e1')
    outline = (55, 65, 81)  # slate-700

    if obs_type == 'rectangle':
      pos = obs.get('position') or {}
      dims = obs.get('dimensions') or {}
      w = float(dims.get('width', 0))
      h = float(dims.get('height', 0))
      rot = float(obs.get('rotation', 0))
      cx = float(pos.get('x', 0))
      cy = float(pos.get('y', 0))

      corners = [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)]
      pts = []
      for dx, dy in corners:
        rx, ry = rotate_point(dx, dy, rot)
        pts.append(to_px(cx + rx, cy + ry))
      draw.polygon(pts, fill=color, outline=outline)
      if show_labels and obs.get('id'):
        draw.text((pts[0][0] + 4, pts[0][1] + 4), str(obs['id']), fill=outline)

    elif obs_type == 'polygon':
      pos = obs.get('position') or {'x': 0, 'y': 0}
      cx = float(pos.get('x', 0))
      cy = float(pos.get('y', 0))
      rot = float(obs.get('rotation', 0))
      pts = []
      for v in obs.get('vertices', []):
        dx = float(v.get('x', 0))
        dy = float(v.get('y', 0))
        rx, ry = rotate_point(dx, dy, rot)
        pts.append(to_px(cx + rx, cy + ry))
      if len(pts) >= 3:
        draw.polygon(pts, fill=color, outline=outline)
        if show_labels and obs.get('id'):
          draw.text((pts[0][0] + 4, pts[0][1] + 4), str(obs['id']), fill=outline)

    elif obs_type == 'circle':
      pos = obs.get('position') or {}
      cx = float(pos.get('x', 0))
      cy = float(pos.get('y', 0))
      r = float(obs.get('radius', 0))
      (x1, y1) = to_px(cx - r, cy - r)
      (x2, y2) = to_px(cx + r, cy + r)
      draw.ellipse((x1, y2, x2, y1), fill=color, outline=outline, width=2)
      if show_labels and obs.get('id'):
        draw.text(to_px(cx + r + 0.1, cy + r + 0.1), str(obs['id']), fill=outline)

    elif obs_type == 'arc-segment':
      arc = obs.get('arcSegment') or {}
      center = arc.get('center') or {}
      cx = float(center.get('x', 0))
      cy = float(center.get('y', 0))
      r_in = float(arc.get('innerRadius', 0))
      r_out = float(arc.get('outerRadius', 0))
      walls = sitemap.get('walls', [])
      a1 = resolve_angle(arc.get('startAngle', 0), center, r_out, walls)
      a2 = resolve_angle(arc.get('endAngle', 0), center, r_out, walls)

      n = 120
      outer = []
      inner = []
      for i in range(n):
        a = a1 + (a2 - a1) * i / (n - 1)
        rad = math.radians(a)
        outer.append(to_px(cx + r_out * math.cos(rad), cy + r_out * math.sin(rad)))
        inner.append(to_px(cx + r_in * math.cos(rad), cy + r_in * math.sin(rad)))
      pts = outer + list(reversed(inner))
      if len(pts) >= 3:
        draw.polygon(pts, fill=color, outline=outline)

    elif obs_type == 'linear':
      linear = obs.get('linear') or {}
      start = linear.get('start') or {}
      end = linear.get('end') or {}
      sx = float(start.get('x', 0))
      sy = float(start.get('y', 0))
      ex = float(end.get('x', 0))
      ey = float(end.get('y', 0))
      width = float(linear.get('width', 0))

      # Calculate perpendicular offset
      dx = ex - sx
      dy = ey - sy
      length = math.sqrt(dx * dx + dy * dy)
      if length > 0:
        nx = -dy / length * width / 2
        ny = dx / length * width / 2
        corners = [
          (sx + nx, sy + ny),
          (sx - nx, sy - ny),
          (ex - nx, ey - ny),
          (ex + nx, ey + ny),
        ]
        pts = [to_px(cx, cy) for cx, cy in corners]
        draw.polygon(pts, fill=color, outline=outline)
        if show_labels and obs.get('id'):
          draw.text((pts[0][0] + 4, pts[0][1] + 4), str(obs['id']), fill=outline)

    # Unknown types are ignored on purpose.

  # Walls
  for w in sitemap.get('walls', []):
    if w.get('geometry') == 'arc':
      arc = w.get('arc') or {}
      center = arc.get('center') or {}
      cx = float(center.get('x', 0))
      cy = float(center.get('y', 0))
      r = float(arc.get('radius', 0))
      start = float(arc.get('startAngle', 0))
      end = float(arc.get('endAngle', 0))
      pts = []
      n = 200
      for i in range(n):
        a = start + (end - start) * i / (n - 1)
        rad = math.radians(a)
        pts.append(to_px(cx + r * math.cos(rad), cy + r * math.sin(rad)))
      if len(pts) >= 2:
        draw.line(pts, fill=(0, 0, 0), width=3)
    else:
      s = w.get('start') or {}
      e = w.get('end') or {}
      draw.line([to_px(float(s.get('x', 0)), float(s.get('y', 0))), to_px(float(e.get('x', 0)), float(e.get('y', 0)))], fill=(0, 0, 0), width=3)

  # Doors
  for door in sitemap.get('doors', []):
    s = door.get('start') or {}
    e = door.get('end') or {}
    draw.line([to_px(float(s.get('x', 0)), float(s.get('y', 0))), to_px(float(e.get('x', 0)), float(e.get('y', 0)))], fill=(0, 160, 0), width=4)

  # Cameras
  for cam in sitemap.get('cameras', []):
    pos = cam.get('position') or {}
    x, y = to_px(float(pos.get('x', 0)), float(pos.get('y', 0)))
    r = 6
    draw.ellipse((x - r, y - r, x + r, y + r), outline=(0, 0, 255), width=3)
    name = (cam.get('name') or 'cam').split(' ')[0]
    if show_labels:
      draw.text((x + 8, y - 8), name, fill=(0, 0, 255))

  out_path.parent.mkdir(parents=True, exist_ok=True)
  img.save(out_path)


def main() -> None:
  args = parse_args()
  sitemap = json.loads(Path(args.input).read_text())
  render(sitemap, Path(args.output), scale=args.scale, pad=args.pad, show_labels=args.show_labels)


if __name__ == '__main__':
  main()

