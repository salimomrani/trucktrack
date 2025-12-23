-- Fleet Analytics - Daily Truck Metrics Materialized View
-- Version: 9
-- Created: 2025-12-23
-- Feature: 006-fleet-analytics
-- Description: Pre-computed daily aggregates for analytics dashboard performance

-- ====================
-- MATERIALIZED VIEW
-- ====================

-- Daily aggregated metrics per truck for fast analytics queries
CREATE MATERIALIZED VIEW daily_truck_metrics AS
WITH daily_positions AS (
    SELECT
        truck_id,
        DATE(timestamp) AS day,
        timestamp,
        latitude,
        longitude,
        speed,
        LAG(latitude) OVER (PARTITION BY truck_id, DATE(timestamp) ORDER BY timestamp) AS prev_lat,
        LAG(longitude) OVER (PARTITION BY truck_id, DATE(timestamp) ORDER BY timestamp) AS prev_lng,
        LAG(timestamp) OVER (PARTITION BY truck_id, DATE(timestamp) ORDER BY timestamp) AS prev_timestamp
    FROM gps_positions
),
daily_distances AS (
    SELECT
        truck_id,
        day,
        SUM(
            CASE
                WHEN prev_lat IS NOT NULL AND prev_lng IS NOT NULL THEN
                    ST_DistanceSphere(
                        ST_MakePoint(prev_lng, prev_lat),
                        ST_MakePoint(longitude, latitude)
                    ) / 1000.0  -- Convert meters to kilometers
                ELSE 0
            END
        ) AS total_distance_km,
        MAX(speed) AS max_speed,
        AVG(NULLIF(speed, 0)) AS avg_speed,
        COUNT(*) AS position_count,
        -- Calculate driving time as sum of intervals when speed > 0
        SUM(
            CASE
                WHEN speed > 0 AND prev_timestamp IS NOT NULL THEN
                    EXTRACT(EPOCH FROM (timestamp - prev_timestamp)) / 60.0  -- minutes
                ELSE 0
            END
        ) AS driving_minutes,
        -- Calculate idle time as sum of intervals when speed = 0
        SUM(
            CASE
                WHEN speed = 0 AND prev_timestamp IS NOT NULL THEN
                    EXTRACT(EPOCH FROM (timestamp - prev_timestamp)) / 60.0  -- minutes
                ELSE 0
            END
        ) AS idle_minutes
    FROM daily_positions
    GROUP BY truck_id, day
)
SELECT
    truck_id,
    day,
    COALESCE(total_distance_km, 0) AS total_distance_km,
    COALESCE(driving_minutes, 0)::INTEGER AS driving_minutes,
    COALESCE(idle_minutes, 0)::INTEGER AS idle_minutes,
    COALESCE(max_speed, 0) AS max_speed,
    COALESCE(avg_speed, 0) AS avg_speed,
    COALESCE(position_count, 0) AS position_count
FROM daily_distances;

-- ====================
-- INDEXES
-- ====================

-- Primary lookup index for truck + day queries
CREATE UNIQUE INDEX idx_daily_metrics_truck_day ON daily_truck_metrics(truck_id, day);

-- Index for date-range queries across all trucks
CREATE INDEX idx_daily_metrics_day ON daily_truck_metrics(day);

-- Index for aggregation by truck
CREATE INDEX idx_daily_metrics_truck ON daily_truck_metrics(truck_id);

-- ====================
-- REFRESH FUNCTION
-- ====================

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_daily_truck_metrics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_truck_metrics;
END;
$$ LANGUAGE plpgsql;

-- ====================
-- DAILY ALERT AGGREGATES VIEW
-- ====================

-- View for alert counts by type and day (not materialized - data changes frequently)
CREATE OR REPLACE VIEW daily_alert_counts AS
SELECT
    n.truck_id,
    DATE(n.triggered_at) AS day,
    n.notification_type AS alert_type,
    COUNT(*) AS alert_count
FROM notifications n
GROUP BY n.truck_id, DATE(n.triggered_at), n.notification_type;

-- ====================
-- GEOFENCE EVENT COUNTS VIEW
-- ====================

-- View for geofence entry/exit counts by day
CREATE OR REPLACE VIEW daily_geofence_events AS
SELECT
    n.truck_id,
    DATE(n.triggered_at) AS day,
    SUM(CASE WHEN n.notification_type = 'GEOFENCE_ENTER' THEN 1 ELSE 0 END) AS geofence_entries,
    SUM(CASE WHEN n.notification_type = 'GEOFENCE_EXIT' THEN 1 ELSE 0 END) AS geofence_exits
FROM notifications n
WHERE n.notification_type IN ('GEOFENCE_ENTER', 'GEOFENCE_EXIT')
GROUP BY n.truck_id, DATE(n.triggered_at);

-- ====================
-- COMMENTS
-- ====================

COMMENT ON MATERIALIZED VIEW daily_truck_metrics IS 'Pre-computed daily aggregates for fleet analytics dashboard. Refresh nightly.';
COMMENT ON COLUMN daily_truck_metrics.total_distance_km IS 'Total distance traveled in kilometers using Haversine formula';
COMMENT ON COLUMN daily_truck_metrics.driving_minutes IS 'Total minutes with speed > 0';
COMMENT ON COLUMN daily_truck_metrics.idle_minutes IS 'Total minutes with speed = 0';
COMMENT ON VIEW daily_alert_counts IS 'Real-time view for alert counts by type and day';
COMMENT ON VIEW daily_geofence_events IS 'Real-time view for geofence entry/exit events by day';
