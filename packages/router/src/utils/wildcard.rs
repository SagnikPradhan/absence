use super::node::Kind;
use napi::{Error, Result, Status};

#[napi(object)]
#[derive(Debug)]
pub struct Wildcard {
  pub kind: Kind,
  pub prefix: String,
  pub wildcard: String,
  pub suffix: String,
}

fn create_wildcard(chars: &Vec<(usize, char)>, start: usize, end: usize, kind: Kind) -> Wildcard {
  let collect = |x: &[(usize, char)]| -> String { x.iter().map(|(_, x)| x).collect() };

  Wildcard {
    kind,
    prefix: collect(&chars[0..start]),
    wildcard: collect(&chars[start..end]),
    suffix: collect(&chars[end..]),
  }
}

fn multi_seg_error() -> Error {
  return Error::new(Status::InvalidArg, String::from("Multiple segments"));
}

#[napi]
pub fn find_wildcard(path: String) -> Result<Option<Wildcard>> {
  let char_indices = path.char_indices();
  let chars = Vec::from_iter(char_indices.clone());

  let mut start: Option<usize> = None;
  let mut kind: Option<Kind> = None;

  for (i, char) in char_indices {
    match char {
      '*' if start.is_some() => return Err(multi_seg_error()),
      '*' => (start, kind) = (Some(i), Some(Kind::CatchAll)),

      ':' if start.is_some() => return Err(multi_seg_error()),
      ':' => (start, kind) = (Some(i), Some(Kind::Parameter)),

      '/' if start.is_some() => {
        return Ok(start.and_then(|s| Some(create_wildcard(&chars, s, i + 1, kind.unwrap()))))
      }

      _ => {}
    }
  }

  return Ok(start.and_then(|s| Some(create_wildcard(&chars, s, path.len(), kind.unwrap()))));
}

#[napi]
pub fn extract_parameter(path: String, kind: Kind) -> String {
  match kind {
    Kind::Parameter => return path[0..path.find("/").unwrap()].to_string(),
    Kind::CatchAll => return path[..path.len() - 1].to_string(),
    _ => panic!("Invalid kind"),
  }
}
