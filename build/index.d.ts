declare enum Kind {
    ROOT = 0,
    STATIC = 1,
    PARAMETER = 2,
    CATCH_ALL = 3
}
type Nullable<V> = V | null;
interface Node<P, K> {
    type: K;
    path: string;
    data: Nullable<P>;
    childIndex: string;
    childValues: Node<P>[];
    childWild: Nullable<Node<P, Kind.PARAMETER | Kind.CATCH_ALL>>;
}
declare class Tree<P> {
    root: Node<P, Kind.ROOT>;
    add(path: string, data: P): void;
    private findAndInsert;
    private findCommonPrefixLength;
    private insertInNode;
    private findWildCard;
    lookup(path: string): {
        data: P;
        parameters: Record<string, string>;
    } | null;
}
export { Tree };
