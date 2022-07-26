#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

use napi::{Env, JsObject, Result};
use std::collections::HashMap;
use std::fmt;

mod utils;
use utils::node::Node;
use utils::tree::{Route, Tree};

#[napi]
struct Router {
  routes: HashMap<String, Tree>,
}

impl fmt::Debug for Router {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    f.debug_struct("Router")
      .field(
        "routes",
        &self
          .routes
          .keys()
          .map(|k| -> (String, &Node) { (k.clone(), &self.routes.get(k).unwrap().root) }),
      )
      .finish()
  }
}

#[napi]
impl Router {
  #[napi(constructor)]
  pub fn new() -> Self {
    Router {
      routes: HashMap::new(),
    }
  }

  #[napi]
  pub fn print(&self) {
    println!("{:#?}", self);
  }

  #[napi]
  pub fn add(&mut self, env: Env, method: String, path: String, handles: JsObject) -> Result<()> {
    self
      .routes
      .entry(method)
      .or_insert(Tree::new())
      .add(env, path, handles)
  }

  #[napi]
  pub fn find(&mut self, env: Env, method: String, path: String) -> Result<Option<Route>> {
    self
      .routes
      .get(&method)
      .map_or_else(|| Ok(None), |tree| tree.lookup(env, path))
  }
}
