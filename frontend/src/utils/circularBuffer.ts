/**
 * Circular Buffer implementation for O(1) insertions
 *
 * Used to replace array.unshift() + array.slice() patterns which are O(n).
 * The buffer maintains a fixed capacity and overwrites oldest items when full.
 */

export class CircularBuffer<T> {
  private buffer: (T | undefined)[]
  private head = 0 // Next write position
  private tail = 0 // Oldest item position
  private _size = 0

  constructor(private capacity: number) {
    if (capacity < 1) {
      throw new Error('CircularBuffer capacity must be at least 1')
    }
    this.buffer = new Array(capacity)
  }

  /**
   * Add an item to the buffer (O(1))
   * Overwrites oldest item if buffer is full
   */
  push(item: T): void {
    this.buffer[this.head] = item
    this.head = (this.head + 1) % this.capacity

    if (this._size < this.capacity) {
      this._size++
    } else {
      // Buffer is full, move tail forward (oldest item is overwritten)
      this.tail = (this.tail + 1) % this.capacity
    }
  }

  /**
   * Add an item to the front (newest position) - same as push
   */
  unshift(item: T): void {
    this.push(item)
  }

  /**
   * Get the most recent item (O(1))
   */
  peek(): T | undefined {
    if (this._size === 0) return undefined
    const idx = (this.head - 1 + this.capacity) % this.capacity
    return this.buffer[idx]
  }

  /**
   * Get item at index (0 = most recent, size-1 = oldest) (O(1))
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this._size) return undefined
    // Convert from logical index (0 = newest) to physical index
    const physicalIdx = (this.head - 1 - index + this.capacity * 2) % this.capacity
    return this.buffer[physicalIdx]
  }

  /**
   * Get current number of items in buffer
   */
  get size(): number {
    return this._size
  }

  /**
   * Get maximum capacity
   */
  get length(): number {
    return this._size
  }

  /**
   * Check if buffer is empty
   */
  isEmpty(): boolean {
    return this._size === 0
  }

  /**
   * Check if buffer is full
   */
  isFull(): boolean {
    return this._size === this.capacity
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.buffer = new Array(this.capacity)
    this.head = 0
    this.tail = 0
    this._size = 0
  }

  /**
   * Convert to array (newest first) (O(n))
   * Use sparingly - prefer iteration methods for large buffers
   */
  toArray(): T[] {
    const result: T[] = []
    for (let i = 0; i < this._size; i++) {
      const item = this.get(i)
      if (item !== undefined) {
        result.push(item)
      }
    }
    return result
  }

  /**
   * Iterate over items (newest first)
   */
  *[Symbol.iterator](): Iterator<T> {
    for (let i = 0; i < this._size; i++) {
      const item = this.get(i)
      if (item !== undefined) {
        yield item
      }
    }
  }

  /**
   * Filter items and return new array
   */
  filter(predicate: (item: T, index: number) => boolean): T[] {
    const result: T[] = []
    for (let i = 0; i < this._size; i++) {
      const item = this.get(i)
      if (item !== undefined && predicate(item, i)) {
        result.push(item)
      }
    }
    return result
  }

  /**
   * Find first item matching predicate
   */
  find(predicate: (item: T) => boolean): T | undefined {
    for (let i = 0; i < this._size; i++) {
      const item = this.get(i)
      if (item !== undefined && predicate(item)) {
        return item
      }
    }
    return undefined
  }

  /**
   * Execute callback for each item (newest first)
   */
  forEach(callback: (item: T, index: number) => void): void {
    for (let i = 0; i < this._size; i++) {
      const item = this.get(i)
      if (item !== undefined) {
        callback(item, i)
      }
    }
  }

  /**
   * Map items to new array
   */
  map<U>(mapper: (item: T, index: number) => U): U[] {
    const result: U[] = []
    for (let i = 0; i < this._size; i++) {
      const item = this.get(i)
      if (item !== undefined) {
        result.push(mapper(item, i))
      }
    }
    return result
  }

  /**
   * Get items as slice (newest first)
   * @param start Start index (default 0)
   * @param end End index (exclusive, default size)
   */
  slice(start = 0, end?: number): T[] {
    const actualEnd = end ?? this._size
    const result: T[] = []
    for (let i = start; i < actualEnd && i < this._size; i++) {
      const item = this.get(i)
      if (item !== undefined) {
        result.push(item)
      }
    }
    return result
  }

  /**
   * Sort items and return new array (does not modify buffer)
   */
  sort(compareFn?: (a: T, b: T) => number): T[] {
    return this.toArray().sort(compareFn)
  }
}
