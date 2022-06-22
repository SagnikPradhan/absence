namespace U {
  type Fn<A extends any[] = any[], R = any> = (...args: A) => R;

  interface Recursive<V> {
    [key: string | symbol]: V | Recursive<K, V>;
  }

  type RecursiveEntries<A, B> = [A, B | RecursiveEntries<A, B>][];
}
