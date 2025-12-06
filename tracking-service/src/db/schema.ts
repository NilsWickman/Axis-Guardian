import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

// Site configuration table
export const siteConfigs = sqliteTable('site_configs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  width: real('width').notNull(),
  height: real('height').notNull(),
  unit: text('unit').notNull().default('meters'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Cameras table
export const cameras = sqliteTable('cameras', {
  id: text('id').primaryKey(),
  siteConfigId: text('site_config_id')
    .notNull()
    .references(() => siteConfigs.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  model: text('model'),
  rtspUrl: text('rtsp_url'),
  webrtcUrl: text('webrtc_url'),
  ipAddress: text('ip_address'),
  positionX: real('position_x').notNull(),
  positionY: real('position_y').notNull(),
  height: real('height').notNull(),
  azimuth: real('azimuth').notNull(),
  elevation: real('elevation').notNull().default(45),
  fieldOfView: real('field_of_view').notNull(),
  color: text('color'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Walls table
export const walls = sqliteTable('walls', {
  id: text('id').primaryKey(),
  siteConfigId: text('site_config_id')
    .notNull()
    .references(() => siteConfigs.id, { onDelete: 'cascade' }),
  startX: real('start_x').notNull(),
  startY: real('start_y').notNull(),
  endX: real('end_x').notNull(),
  endY: real('end_y').notNull(),
  type: text('type').notNull().default('external'),
});

// Type exports for TypeScript
export type SiteConfig = typeof siteConfigs.$inferSelect;
export type NewSiteConfig = typeof siteConfigs.$inferInsert;
export type Camera = typeof cameras.$inferSelect;
export type NewCamera = typeof cameras.$inferInsert;
export type Wall = typeof walls.$inferSelect;
export type NewWall = typeof walls.$inferInsert;
