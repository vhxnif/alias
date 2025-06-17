import Database from "bun:sqlite"

export class SqliteTable {
  name!: string
}

export class BranchHistory {
  name!: string
  lastSwitchTime!: number
  frequency!: number
}

export class BranchHistoryStore {
  private readonly db: Database

  constructor(db: Database) {
    this.db = db
    const t = this.db
      .query("SELECT name FROM sqlite_master WHERE type='table';")
      .as(SqliteTable)
      .all()
      .find((it) => it.name === "branch_history")
    if (!t) {
      this.db.run(`
                CREATE TABLE IF NOT EXISTS branch_history (
                    name TEXT,
                    last_switch_time INTEGER,
                    frequency INTEGER,
                    CONSTRAINT branch_history_PK PRIMARY KEY (name)
                );
            `)
    }
  }

  addOrUpdate(name: string) {
    const r = this.db
      .query(
        `SELECT name, last_switch_time as lastSwitchTime, frequency FROM branch_history WHERE name = ?`,
      )
      .as(BranchHistory)
      .get(name)
    if (r) {
      // update
      this.update(name, r.frequency)
      return
    }
    // insert
    this.db
      .prepare(
        `INSERT INTO branch_history (name, last_switch_time, frequency) VALUES (?, ?, ?)`,
      )
      .run(name, Date.now(), 1)
  }

  update(name: string, frequency: number) {
    // update
    this.db
      .prepare(
        `UPDATE branch_history set last_switch_time = ?, frequency = ? WHERE name = ?`,
      )
      .run(Date.now(), frequency + 1, name)
    return
  }

  delete(name: string) {
    this.db.prepare(`DELETE FROM branch_history WHERE name = ?`).run(name)
  }

  query(name: string) {
    return this.db
      .query(
        `SELECT name, last_switch_time as lastSwitchTime, frequency FROM branch_history WHERE name like ?`,
      )
      .as(BranchHistory)
      .all(`%${name}%`)
  }

  close() {
    if (this.db) {
      this.db.close()
    }
  }
}
