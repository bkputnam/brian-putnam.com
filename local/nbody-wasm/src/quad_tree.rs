use core::f64;

use crate::vec2::Vec2;

enum QuadTreeContents {
    None,
    // Contents are an index into the positions Vec
    Point(usize),
    // Contents are the index in tree.nodes of the first child. The other 3
    // children are guaranteed to be at index+1, index+2, and index+3.
    Children(usize),
}

struct QuadTreeNode {
    min_x: f64, // Inclusive
    max_x: f64, // Exclusive
    min_y: f64, // Inclusive
    max_y: f64, // Exclusive
    points_contained: usize,
    contents: QuadTreeContents,
}

impl QuadTreeNode {
    fn get_child_offset(&self, point: Vec2) -> usize {
        let Vec2 { x, y } = point;
        let to_zero_or_one = |val: f64, min: f64, max: f64| {
            if val >= (min + max) / 2.0 {
                1usize
            } else {
                0usize
            }
        };
        let x_index = to_zero_or_one(x, self.min_x, self.max_x);
        let y_index = to_zero_or_one(y, self.min_y, self.max_y);
        x_index + 2 * y_index
    }

    fn is_contained(&self, position: Vec2) -> bool {
        return (position.x >= self.min_x)
            && (position.x < self.max_x)
            && (position.y >= self.min_y)
            && (position.y < self.max_y);
    }
}

pub struct QuadTree {
    nodes: Vec<QuadTreeNode>,
    num_nodes: usize,
    num_points: usize,
}

impl QuadTree {
    pub fn new(positions: &Vec<Vec2>) -> QuadTree {
        if positions.len() == 0 {
            return QuadTree {
                nodes: vec![],
                num_nodes: 0,
                num_points: 0,
            };
        }
        let Vec2 { x, y } = positions[0];
        let mut min_x = x;
        let mut max_x = x;
        let mut min_y = y;
        let mut max_y = y;
        for Vec2 { x, y } in positions.iter().skip(1).copied() {
            if x < min_x {
                min_x = x;
            } else if x > max_x {
                max_x = x;
            }
            if y < min_y {
                min_y = y;
            } else if y > max_y {
                max_y = y;
            }
        }

        let len = positions.len();
        let log2 = (len as f64).log2().round() as usize;
        // I'm not sure if this is the exact capacity needed, but it's fine if
        // the Vec grows, and this should be a good start.
        let mut nodes: Vec<QuadTreeNode> = Vec::with_capacity(len * log2);
        let root_node = QuadTreeNode {
            min_x: min_x,
            // Add 1.0 to prevent a situation where the max position wouldn't be
            // considered to be inside its node, because node upper bounds are
            // exclusive
            max_x: max_x + 1.0,
            min_y: min_y,
            // Same idea as max_x
            max_y: max_y + 1.0,
            points_contained: 0,
            contents: QuadTreeContents::None,
        };
        nodes.push(root_node);

        QuadTree {
            nodes,
            num_nodes: 1,
            num_points: 0,
        }
    }

    fn allocate_4_nodes(&mut self) -> usize {
        let old_len = self.nodes.len();
        for _ in 0..4 {
            self.nodes.push(QuadTreeNode {
                min_x: 0.0,
                max_x: 0.0,
                min_y: 0.0,
                max_y: 0.0,
                points_contained: 0,
                contents: QuadTreeContents::None,
            });
        }
        old_len
    }

    fn insert(&mut self, positions: &Vec<Vec2>, position_index: usize) {
        let pos = positions[position_index];
        let mut next_opt: Option<usize> = Some(0);
        while let Some(next_index) = next_opt {
            let node = &mut self.nodes[next_index];
            node.points_contained += 1;
            node.contents = match &mut node.contents {
                QuadTreeContents::None => {
                    next_opt = Option::None;
                    QuadTreeContents::Point(vec![position_index])
                }
                QuadTreeContents::Point(sibling_indices) => {
                    let sibling_node = positions[sibling_indices[0]];
                    if sibling_node.x == pos.x && sibling_node.y == pos.y {
                        // Prevent infinite recursion by storing identical
                        // points in a Vec of indexes instead of trying to split
                        // them into their own child nodes.
                        sibling_indices.push(position_index);
                        next_opt = Option::None;
                        QuadTreeContents::Point(*sibling_indices)
                    } else {
                        let first_index = self.create_child_nodes(node);
                        // self.insert(positions, sibling_indices[0]);

                        // Note: it doesn't matter which sibling_index we use; since
                        // they're all identical they'll all get copied to the same
                        // child node.
                        let child_index =
                            first_index + node.get_child_offset(sibling_node);
                        self.nodes[child_index].contents =
                            QuadTreeContents::Point(*sibling_indices);
                        self.nodes[child_index].points_contained =
                            sibling_indices.len();

                        // Don't modify next_opt; its contents should remain as
                        // `node_index` on the next round. The modifications
                        // we've just made to node should cause it to hit the
                        // QuadTreeContents::Children(_) branch next time, and
                        // continue onwards
                        QuadTreeContents::Children(first_index)
                    }
                }
                QuadTreeContents::Children(first_index) => {
                    let child_index = *first_index
                        + node.get_child_offset(positions[position_index]);
                    next_opt = Some(child_index);
                    // Leave node.contents unchanged
                    QuadTreeContents::Children(*first_index)
                }
            }
        }
    }

    fn create_child_nodes(&mut self, node: &QuadTreeNode) -> usize {
        let first_index = self.allocate_4_nodes();
        let mid_x = (node.min_x + node.max_x) / 2.0;
        let mid_y = (node.min_y + node.max_y) / 2.0;

        let ll = QuadTreeNode {
            min_x: node.min_x,
            max_x: mid_x,
            min_y: node.min_y,
            max_y: mid_y,
            points_contained: 0,
            contents: QuadTreeContents::None,
        };
        let lg = QuadTreeNode {
            min_x: node.min_x,
            max_x: mid_x,
            min_y: mid_y,
            max_y: node.max_y,
            points_contained: 0,
            contents: QuadTreeContents::None,
        };
        let gl = QuadTreeNode {
            min_x: mid_x,
            max_x: node.max_x,
            min_y: node.min_y,
            max_y: mid_y,
            points_contained: 0,
            contents: QuadTreeContents::None,
        };
        let gg = QuadTreeNode {
            min_x: mid_x,
            max_x: node.max_x,
            min_y: mid_y,
            max_y: node.max_y,
            points_contained: 0,
            contents: QuadTreeContents::None,
        };

        self.nodes[first_index + 0] = ll;
        self.nodes[first_index + 1] = lg;
        self.nodes[first_index + 2] = gl;
        self.nodes[first_index + 3] = gg;

        first_index
    }
}
