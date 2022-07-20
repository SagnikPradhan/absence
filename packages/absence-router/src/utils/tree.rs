use super::node::{create_node, find_relatable_node_index, insert_node, split_node, Kind, Node};
use super::path::{clean_path, find_common};
use super::wildcard::{extract_parameter, find_wildcard};

use napi::{Env, Error, JsObject, Result, Status};
use std::collections::HashMap;

#[napi(object)]
pub struct Route {
  pub parameters: HashMap<String, String>,
  #[napi(ts_type = "any[]")]
  pub handles: JsObject,
}

pub struct Tree {
  pub root: Node,
}

impl Tree {
  pub fn new() -> Self {
    Tree {
      root: create_node("/", Kind::Root),
    }
  }

  pub fn add(&mut self, env: Env, path: String, handles: JsObject) -> Result<()> {
    let handles_reference = env.create_reference(handles)?;

    let mut current_node = &mut self.root;
    let mut current_path = clean_path(path);

    'NEXT_NODE: loop {
      let parsed_path = find_common(current_path.clone(), current_node.path.clone());

      // If the node path's length is larger than common length, split it
      if parsed_path.node_excess.len() > 0 {
        split_node(current_node, &parsed_path.common);
      }

      // If there are nested paths in target
      if parsed_path.target_excess.len() > 0 {
        // If there is a relatable node
        if let Some(index) = find_relatable_node_index(current_node, &parsed_path.target_excess) {
          current_node = current_node.children.get_mut(index).unwrap();
          current_path = parsed_path.target_excess;
          continue 'NEXT_NODE;
        }

        // If there is a wildcard
        if let Some(wildcard) = find_wildcard(parsed_path.target_excess.clone())? {
          // If the wildcard has a prefix, add another node
          if wildcard.prefix.len() > 0 {
            current_node = insert_node(current_node, create_node(&wildcard.prefix, Kind::Static));
          }

          // If some child already exists with different parameter name, error
          if let Some(wild_child) = &current_node.wild_child {
            if wild_child.path.ne(&wildcard.wildcard) {
              return Err(Error::new(
                Status::Unknown,
                "Duplicate parameter".to_string(),
              ));
            }
          } else {
            current_node.wild_child = Some(Box::new(create_node(&wildcard.wildcard, wildcard.kind)))
          }

          current_node = current_node.wild_child.as_mut().unwrap().as_mut();

          // If there is suffix after parameter, add the child nodes
          if wildcard.suffix.len() > 0 {
            if wildcard.kind == Kind::CatchAll {
              return Err(Error::new(
                Status::Unknown,
                "Route after catchall".to_string(),
              ));
            }

            current_path = format!("{}{}", wildcard.wildcard, wildcard.suffix);
            continue 'NEXT_NODE;
          }
        }
        // If there is no wildcard
        else {
          current_node = insert_node(
            current_node,
            create_node(&parsed_path.target_excess, Kind::Static),
          );
        }
      }
      // If the node path, is equal to target path
      else {
        if current_node.route.is_some() {
          return Err(Error::new(Status::Unknown, "Duplicate route".to_string()));
        }
      }

      current_node.route = Some(handles_reference);
      return Ok(());
    }
  }

  pub fn lookup(&self, env: Env, path: String) -> Result<Option<Route>> {
    let mut current_node = &self.root;
    let mut current_path = clean_path(path);
    let mut parameters: HashMap<String, String> = HashMap::new();

    'NEXT_NODE: loop {
      // Strip the prefix
      current_path = current_path
        .strip_prefix(&current_node.path)
        .unwrap()
        .to_string();

      // If there's no suffix left, it matches this node
      if current_path.len() == 0 {
        break;
      }

      // Look through routes and find a node
      if let Some(index) = find_relatable_node_index(current_node, &current_path.to_string()) {
        current_node = current_node.children.get(index).unwrap();
        continue 'NEXT_NODE;
      }

      // If there is a wilchild
      if let Some(wild_child) = &current_node.wild_child {
        current_node = wild_child;

        let parameter = current_node.path[1..current_node.path.len() - 1].to_string();
        let parameter_value = extract_parameter(current_path.clone(), current_node.kind);

        parameters.insert(parameter, parameter_value.clone());

        // If not nested path is left, exit
        if current_path.len() == parameter_value.len() + 1 {
          break;
        }

        current_path = current_path[parameter_value.len() + 1..].to_string();

        if let Some(index) = find_relatable_node_index(current_node, &current_path) {
          current_node = current_node.children.get(index).unwrap();
          continue 'NEXT_NODE;
        }
      }

      return Ok(None);
    }

    return Ok(current_node.route.as_ref().and_then(|reference| {
      Some(Route {
        handles: env.get_reference_value::<JsObject>(reference).unwrap(),
        parameters,
      })
    }));
  }
}
