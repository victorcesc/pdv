use rusqlite::{Connection, Result, params};
use crate::models::SyncLog;
use chrono::{DateTime, Utc, FixedOffset};

fn parse_datetime(s: String) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(&s)
        .ok()
        .map(|dt: DateTime<FixedOffset>| dt.with_timezone(&Utc))
}

pub struct SyncRepository;

impl SyncRepository {
    pub fn create(conn: &Connection, sync_log: &SyncLog) -> Result<i64> {
        conn.execute(
            "INSERT INTO sync_logs (entity_type, entity_id, action, payload_json, synced) 
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                sync_log.entity_type,
                sync_log.entity_id,
                sync_log.action,
                sync_log.payload_json,
                sync_log.synced
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn find_pending(conn: &Connection) -> Result<Vec<SyncLog>> {
        let mut stmt = conn.prepare(
            "SELECT id, entity_type, entity_id, action, payload_json, synced, sync_date, 
             error_message, created_at FROM sync_logs WHERE synced = 0 ORDER BY created_at"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(SyncLog {
                id: Some(row.get(0)?),
                entity_type: row.get(1)?,
                entity_id: row.get(2)?,
                action: row.get(3)?,
                payload_json: row.get(4)?,
                synced: row.get(5)?,
                sync_date: row.get::<_, Option<String>>(6)?
                    .and_then(parse_datetime),
                error_message: row.get(7)?,
                created_at: row.get::<_, Option<String>>(8)?
                    .and_then(parse_datetime),
            })
        })?;
        
        let mut logs = Vec::new();
        for row in rows {
            logs.push(row?);
        }
        Ok(logs)
    }

    pub fn mark_as_synced(conn: &Connection, id: i64) -> Result<usize> {
        conn.execute(
            "UPDATE sync_logs SET synced = 1, sync_date = CURRENT_TIMESTAMP WHERE id = ?1",
            params![id],
        )
    }

    pub fn mark_as_error(conn: &Connection, id: i64, error_message: &str) -> Result<usize> {
        conn.execute(
            "UPDATE sync_logs SET error_message = ?1 WHERE id = ?2",
            params![error_message, id],
        )
    }
}

