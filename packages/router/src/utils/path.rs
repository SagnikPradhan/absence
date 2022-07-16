#[napi(object)]
pub struct Path {
  pub common: String,
  pub node_excess: String,
  pub target_excess: String,
}

#[napi]
pub fn find_common(target_path: String, node_path: String) -> Path {
  let common = target_path
    .chars()
    .zip(node_path.chars())
    .take_while(|(a, b)| a == b)
    .map(|(a, _)| a)
    .collect::<String>();

  let common_len = common.len();

  Path {
    common,
    node_excess: node_path[common_len..].to_string(),
    target_excess: target_path[common_len..].to_string(),
  }
}

#[napi]
pub fn clean_path(path: String) -> String {
  let mut parsed_string = String::from("/");
  let mut last_char = '/';

  for char in path.chars() {
    if char == '/' {
      if last_char == '/' {
        continue;
      }
    }

    parsed_string.push(char);
    last_char = char;
  }

  if last_char != '/' {
    parsed_string.push('/')
  }

  return parsed_string;
}
