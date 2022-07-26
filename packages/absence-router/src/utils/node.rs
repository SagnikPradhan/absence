use napi::bindgen_prelude::ToNapiValue;
use napi::Ref;
use std::fmt;
use std::mem;

#[napi]
#[derive(Debug, PartialEq)]
pub enum Kind {
  Root,
  Static,
  Parameter,
  CatchAll,
}

pub struct Node {
  pub kind: Kind,
  pub path: String,
  pub priority: u16,
  pub route: Option<Ref<()>>,
  pub indices: String,
  pub children: Vec<Node>,
  pub wild_child: Option<Box<Node>>,
}

/// Create new node
pub fn create_node(path: &str, kind: Kind) -> Node {
  Node {
    path: String::from(path),
    route: None,
    kind: kind,
    priority: 0,
    indices: String::new(),
    children: Vec::new(),
    wild_child: None,
  }
}

/// Splits node at prefix
pub fn split_node(node: &mut Node, prefix: &String) {
  // Parent's new values
  let mut swap_value = create_node(&prefix, Kind::Static);
  swap_value.priority = node.priority + 1;

  // Replace parent with new, and get parent as child
  mem::swap(node, &mut swap_value);

  // Update child's path
  swap_value.path = swap_value.path.strip_prefix(prefix).unwrap().to_string();

  // Add child to parent
  node.indices = swap_value.path.chars().nth(0).unwrap().to_string();
  node.children.push(swap_value);
}

/// Finds node with the index
pub fn find_relatable_node_index(node: &Node, path: &String) -> Option<usize> {
  let char = path.chars().nth(0).unwrap();
  let index = node.indices.chars().position(|i_char| i_char.eq(&char));
  return index;
}

/// Insert node
pub fn insert_node(node: &mut Node, child: Node) -> &mut Node {
  let child_index = &child.path.chars().nth(0).unwrap().to_string();

  node.indices.push_str(child_index);
  node.children.push(child);

  node.children.last_mut().unwrap()
}

impl fmt::Debug for Node {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    f.debug_struct("Node")
      .field("kind", &self.kind)
      .field("path", &self.path)
      .field("priority", &self.priority)
      .field("indices", &self.indices)
      .field("children", &self.children)
      .field("wild_child", &self.wild_child)
      .field("route", &self.route.is_some())
      .finish()
  }
}
