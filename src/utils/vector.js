/**
 * Simple 2D vector math utilities.
 * All functions are pure and return new objects.
 */

export function vec(x = 0, y = 0) {
  return { x, y };
}

export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v, s) {
  return { x: v.x * s, y: v.y * s };
}

export function length(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalize(v) {
  const len = length(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function distance(a, b) {
  return length(sub(a, b));
}

export function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

export function rotate(v, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
}

export function angle(v) {
  return Math.atan2(v.y, v.x);
}

export function fromAngle(a, magnitude = 1) {
  return { x: Math.cos(a) * magnitude, y: Math.sin(a) * magnitude };
}

export function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** AABB collision check for two entities with pos and size (half-width) */
export function aabbCollision(a, aSize, b, bSize) {
  return (
    Math.abs(a.x - b.x) < aSize + bSize &&
    Math.abs(a.y - b.y) < aSize + bSize
  );
}

/** Circle collision check */
export function circleCollision(a, aRadius, b, bRadius) {
  return distance(a, b) < aRadius + bRadius;
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}
