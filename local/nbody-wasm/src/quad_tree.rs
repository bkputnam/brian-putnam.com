use core::f64;
use std::{mem, ops::Range};

use crate::vec2::Vec2;

const MAX_DEPTH: u32 = 10;

pub enum QuadTreeContents {
    Points(Vec<usize>),
    Children([usize; 4]),
}

impl QuadTreeContents {
    fn is_points(&self) -> bool {
        match self {
            QuadTreeContents::Points(_) => true,
            _ => false,
        }
    }
}

pub struct QuadTreeNode {
    // Both x and y are (inclusive..exclusive) ranges
    pub x: Range<f64>,
    pub y: Range<f64>,

    // Numerator for calculating center of mass. =sum(mass[i] * pos[i])
    // https://en.wikipedia.org/wiki/Center_of_mass#A_system_of_particles
    pub center_of_mass: Vec2,
    // Denominator for calculating center of mass. =sum(mass[i])
    // https://en.wikipedia.org/wiki/Center_of_mass#A_system_of_particles
    pub total_mass: f64,

    // Total points contained is
    // num_child_points + QuadTreeContents::Points(_).len()
    pub contents: QuadTreeContents,
}

impl QuadTreeNode {
    fn new(x: Range<f64>, y: Range<f64>) -> QuadTreeNode {
        QuadTreeNode {
            x,
            y,

            center_of_mass: Vec2::zero(),
            total_mass: 0.0,

            contents: QuadTreeContents::Points(vec![]),
        }
    }

    fn get_child_offset(&self, point: Vec2) -> usize {
        let Vec2 { x, y } = point;
        let to_zero_or_one = |val: f64, min: f64, max: f64| {
            if val >= (min + max) / 2.0 {
                1usize
            } else {
                0usize
            }
        };
        let x_index = to_zero_or_one(x, self.x.start, self.x.end);
        let y_index = to_zero_or_one(y, self.y.start, self.y.end);
        2 * x_index + y_index
    }

    fn contains(&self, position: Vec2) -> bool {
        return (position.x >= self.x.start)
            && (position.x < self.x.end)
            && (position.y >= self.y.start)
            && (position.y < self.y.end);
    }

    fn replace_contents(
        &mut self,
        new_contents: QuadTreeContents,
    ) -> QuadTreeContents {
        mem::replace(&mut self.contents, new_contents)
    }

    fn update_center_of_mass(&mut self, pos: Vec2, mass: f64) {
        if mass == 0.0 {
            panic!("Error: can't have particles with 0 mass");
        }
        // Update formula adapted from here:
        // https://math.stackexchange.com/questions/106700/incremental-averaging#answer-106720
        // Lightly tweaked because this is a weighted average. The formula
        // to update a weighted average with (val, weight) is:
        // sum_weights += weight
        // avg += (val - avg) * weight / sum_weights
        self.total_mass += mass;
        self.center_of_mass +=
            (pos - self.center_of_mass) * mass / self.total_mass;
    }

    pub fn diagonal_len(&self) -> f64 {
        let delta_x = self.x.end - self.x.start;
        let delta_y = self.y.end - self.y.start;
        (delta_x * delta_x + delta_y * delta_y).sqrt()
    }
}

pub struct QuadTree {
    nodes: Vec<QuadTreeNode>,
    unused_nodes: Vec<usize>,
    num_points: usize,
}

impl QuadTree {
    #[allow(dead_code)]
    fn new_without_weights(positions: &Vec<Vec2>) -> QuadTree {
        let weights = positions.iter().copied().map(|_| 1.0f64).collect();
        QuadTree::new(positions, &weights)
    }

    pub fn new(positions: &Vec<Vec2>, masses: &Vec<f64>) -> QuadTree {
        if positions.len() == 0 {
            return QuadTree {
                nodes: vec![],
                unused_nodes: vec![],
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
        let root_node =
            QuadTreeNode::new(min_x..(max_x + 1.0), min_y..(max_y + 1.0));
        nodes.push(root_node);

        let mut result = QuadTree {
            nodes,
            unused_nodes: vec![],
            num_points: 0,
        };
        for i in 0..len {
            result.insert(positions, masses, i);
        }

        result
    }

    #[allow(dead_code)]
    pub fn num_points(&self) -> usize {
        self.num_points
    }

    fn get_or_create_child_node(&mut self, child_node: QuadTreeNode) -> usize {
        if let Some(index) = self.unused_nodes.pop() {
            self.nodes[index] = child_node;
            index
        } else {
            let index = self.nodes.len();
            self.nodes.push(child_node);
            index
        }
    }

    pub fn insert(
        &mut self,
        positions: &Vec<Vec2>,
        masses: &Vec<f64>,
        position_index: usize,
    ) {
        self.insert_at_node(
            /* node_index= */ 0,
            /* node_depth= */ 0,
            positions,
            masses,
            position_index,
        );
        self.num_points += 1;
    }

    fn insert_at_node(
        &mut self,
        node_index: usize,
        node_depth: u32,
        positions: &Vec<Vec2>,
        masses: &Vec<f64>,
        position_index: usize,
    ) {
        let pos = positions[position_index];
        if !self.nodes[node_index].contains(pos) {
            panic!("Inserting into wrong node");
        }

        self.nodes[node_index].update_center_of_mass(
            positions[position_index],
            masses[position_index],
        );

        let insert_self = match &self.nodes[node_index].contents {
            QuadTreeContents::Children(_) => false,
            QuadTreeContents::Points(points) => {
                points.len() == 0 || node_depth == MAX_DEPTH
            }
        };

        // Handle the insertion case (requires a mutable ref to node.contents)
        if insert_self {
            match &mut self.nodes[node_index].contents {
                QuadTreeContents::Points(points) => {
                    points.push(position_index);
                    return;
                }
                _ => {
                    panic!("This should be impossible");
                }
            }
        }

        // If contents is QuadTreeContents::Points but we're not inserting into
        // self, then we need to convert contents to QuadTreeContents::Children
        // before we proceed.
        if self.nodes[node_index].contents.is_points() {
            let child_indices = self.create_child_nodes(node_index);
            let new_contents = QuadTreeContents::Children(child_indices);
            let old_contents =
                self.nodes[node_index].replace_contents(new_contents);
            match old_contents {
                QuadTreeContents::Points(child_positions) => {
                    for child_pos_index in child_positions {
                        let child_pos = positions[child_pos_index];
                        let child_node_index = child_indices[self.nodes
                            [node_index]
                            .get_child_offset(child_pos)];
                        self.insert_at_node(
                            child_node_index,
                            node_depth + 1,
                            positions,
                            masses,
                            child_pos_index,
                        );
                    }
                }
                _ => {
                    panic!("This should be impossible");
                }
            }
        }

        let node = &self.nodes[node_index];
        match node.contents {
            QuadTreeContents::Children(child_indices) => {
                let child_index = child_indices[node.get_child_offset(pos)];
                self.insert_at_node(
                    child_index,
                    node_depth + 1,
                    positions,
                    masses,
                    position_index,
                );
            }
            _ => {
                panic!("This should be impossible");
            }
        }
    }

    fn create_child_nodes(&mut self, node_index: usize) -> [usize; 4] {
        let min_max_mid = |r: &Range<f64>| -> (f64, f64, f64) {
            (r.start, r.end, (r.start + r.end) / 2.0)
        };
        let (x_min, x_max, x_mid) = min_max_mid(&self.nodes[node_index].x);
        let (y_min, y_max, y_mid) = min_max_mid(&self.nodes[node_index].y);

        [
            self.get_or_create_child_node(QuadTreeNode::new(
                x_min..x_mid,
                y_min..y_mid,
            )),
            self.get_or_create_child_node(QuadTreeNode::new(
                x_min..x_mid,
                y_mid..y_max,
            )),
            self.get_or_create_child_node(QuadTreeNode::new(
                x_mid..x_max,
                y_min..y_mid,
            )),
            self.get_or_create_child_node(QuadTreeNode::new(
                x_mid..x_max,
                y_mid..y_max,
            )),
        ]
    }

    #[allow(dead_code)]
    fn max_depth(&self) -> u32 {
        let mut max_depth = 0;
        self.walk(|_index, depth, _node| {
            if depth > max_depth {
                max_depth = depth;
            }
            true
        });
        max_depth
    }

    pub fn walk<'a, FN: FnMut(usize, u32, &'a QuadTreeNode) -> bool>(
        &'a self,
        callback: FN,
    ) {
        // Can't take a mutable reference to a parameter, so copy it first.
        let mut foo = callback;
        self.walk_subtree(
            /* root_index= */ 0, /* root_depth= */ 0, &mut foo,
        );
    }

    fn walk_subtree<'a, FN: FnMut(usize, u32, &'a QuadTreeNode) -> bool>(
        &'a self,
        root_index: usize,
        root_depth: u32,
        callback: &mut FN,
    ) {
        let node = &self.nodes[root_index];
        let recurse = callback(root_index, root_depth, node);
        if recurse {
            match node.contents {
                QuadTreeContents::Children(child_indices) => {
                    for child_index in child_indices {
                        self.walk_subtree(
                            child_index,
                            root_depth + 1,
                            callback,
                        );
                    }
                }
                _ => {}
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_and_insert() {
        let positions = vec![
            Vec2 { x: 3.1, y: 4.1 },
            Vec2 { x: 5.9, y: 2.6 },
            Vec2 { x: 5.3, y: 5.8 },
        ];

        let quadtree = QuadTree::new_without_weights(&positions);
        assert_eq!(quadtree.num_points(), 3);
        let max_depth = quadtree.max_depth();
        assert!(max_depth > 0);
        assert!(max_depth <= 3);
    }

    #[test]
    fn test_insert_multiple_into_same_quadrant() {
        let positions = vec![
            // Min
            Vec2 { x: 0.0, y: 0.0 },
            // Max
            Vec2 { x: 10.0, y: 10.0 },
            // The rest should go in quadrant 3 (near 10,10)
            Vec2 { x: 9.0, y: 9.0 },
            Vec2 { x: 9.9, y: 9.9 },
            Vec2 { x: 9.99, y: 9.99 },
            Vec2 { x: 9.999, y: 9.999 },
            Vec2 {
                x: 9.9999,
                y: 9.9999,
            },
            Vec2 {
                x: 9.99999,
                y: 9.99999,
            },
        ];

        let quadtree = QuadTree::new_without_weights(&positions);
        assert_eq!(quadtree.num_points(), 8);
        let max_depth = quadtree.max_depth();
        assert!(max_depth == MAX_DEPTH);
    }

    #[test]
    fn test_center_of_mass() {
        let positions = vec![
            // Min
            Vec2 { x: 0.0, y: 0.0 },
            // Max
            Vec2 { x: 10.0, y: 10.0 },
            // The rest should go in quadrant 3 (near 10,10)
            Vec2 { x: 9.0, y: 9.0 },
            Vec2 { x: 9.9, y: 9.9 },
            Vec2 { x: 9.99, y: 9.99 },
            Vec2 { x: 9.999, y: 9.999 },
            Vec2 {
                x: 9.9999,
                y: 9.9999,
            },
            Vec2 {
                x: 9.99999,
                y: 9.99999,
            },
        ];

        let masses: Vec<f64> = positions
            .iter()
            .enumerate()
            .map(|(index, _)| (index + 1) as f64)
            .collect();

        let mut expected_center_of_mass = Vec2::zero();
        let mut expected_total_mass: f64 = 0.0;
        for (pos, mass) in positions.iter().zip(&masses) {
            expected_center_of_mass += *pos * *mass;
            expected_total_mass += mass;
        }
        expected_center_of_mass /= expected_total_mass;

        let quadtree = QuadTree::new(&positions, &masses);

        assert_eq!(quadtree.nodes[0].center_of_mass, expected_center_of_mass);
        assert_eq!(quadtree.nodes[0].total_mass, expected_total_mass);
    }
}
