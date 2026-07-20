//// Internal data/integration layer (FR-21). Reads from Postgres (adamas DB)
//// via the synapse_pg wrapper. Never calls external localhost microservices.

import gleam/dynamic
import gleam/list
import synapse_pg as pg

pub type School {
  School(id: String, code: String, name: String)
}

pub type Department {
  Department(id: String, school_id: String, code: String, name: String)
}

pub type Year {
  Year(id: String, level: String)
}

//// List all schools.
pub fn list_schools() -> Result(List(School), String) {
  case pg.query("SELECT id, code, name FROM schools ORDER BY code", dynamic.list([])) {
    pg.Rows(rows) -> Ok(list.map(rows, fn(r) { School(at(r, 0), at(r, 1), at(r, 2)) }))
    pg.Failed(reason) -> Error(reason)
  }
}

//// List departments for a school code.
pub fn list_departments(school_code: String) -> Result(List(Department), String) {
  let params = dynamic.list([dynamic.string(school_code)])
  case pg.query(
    "SELECT d.id, d.school_id, d.code, d.name
       FROM departments d JOIN schools s ON d.school_id = s.id
      WHERE s.code = $1 ORDER BY d.code",
    params,
  ) {
    pg.Rows(rows) ->
      Ok(list.map(rows, fn(r) {
        Department(at(r, 0), at(r, 1), at(r, 2), at(r, 3))
      }))
    pg.Failed(reason) -> Error(reason)
  }
}

//// List the 4 academic years.
pub fn list_years() -> Result(List(Year), String) {
  case pg.query("SELECT id, level FROM years ORDER BY level", dynamic.list([])) {
    pg.Rows(rows) -> Ok(list.map(rows, fn(r) { Year(at(r, 0), at(r, 1)) }))
    pg.Failed(reason) -> Error(reason)
  }
}

fn at(row: List(String), i: Int) -> String {
  case list.drop(row, i) |> list.first {
    Ok(v) -> v
    Error(_) -> ""
  }
}
