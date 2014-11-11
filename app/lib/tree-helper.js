var _ = require('underscore');

function makeNode (item) {
	if (typeof item === 'string') {
		return {
			name: item
		};
	}

	return item;
}

function makeTreeFromPath (path, withEnd) {
	var item, root;
	while ((item = path.pop())) {
		var node = makeNode(item);
		if (!root) {
			root = node;
			if (withEnd) {
				withEnd(root);
			}
		} else {
			node.children = [root];
			root = node;
		}
	}
	return root;
}

function mergeTrees (t, u, mergeFunction) {
	if (!u) {
		return t;
	}
	if (!t) {
		return u;
	}

	function discoverChildren (node, target) {
		_.each(node.children, function (child) {
			if (target[child.name]) {
				throw new Error('One of the merged trees has 2 children with the same name (' + child.name + ')');
			}
			target[child.name] = child;
		});
	}

	if (t.name === u.name) {
		_.each(u, function (value, property) {
			if (property !== 'children') {
				if (!t.hasOwnProperty(property) || !mergeFunction) {
					t[property] = value;
				} else {
					t[property] = mergeFunction(property, t[property], value);
				}
			}
		});

		if (u.children && u.children.length > 0) {
			if (!t.children || t.children.length === 0) {
				t.children = u.children;
			} else {
				var newChildren = [];

				var childrenOfT = {}, childrenOfU = {};

				discoverChildren(t, childrenOfT);
				discoverChildren(u, childrenOfU);

				// Handle common children and children only found in t
				_.each(t.children, function (a) {
					if (childrenOfU[a.name]) {
						newChildren.push(mergeTrees(a, childrenOfU[a.name], mergeFunction));
						delete childrenOfU[a.name];
					} else {
						newChildren.push(a);
					}
				});
				
				// Handle children that are just in u
				_.each(u.children, function (b) {
					if (childrenOfU[b.name]) {
						newChildren.push(b);
					}
				});

				t.children = newChildren;
			}
		}

		return t;
	} else {
		return {
			name: t.name + ', ' + u.name,
			children: [t, u]
		};
	}
}

function mergePath (t, path) {
	return mergeTrees(t, makeTreeFromPath(path));
}

function flatten (t) {
	var objects = [];
	if (!t) {
		return objects;
	}

	objects.push(_.omit(t, 'children'));
	_.each(t.children, function (child) {
		objects = objects.concat(flatten(child));
	});

	return objects;
}

function doNumber (t, pos) {
	t.lft = pos;

	_.each(t.children, function (child) {
		pos = doNumber(child, ++pos);
	});

	t.rgt = ++pos;

	return pos;
}

function number (t) {
	doNumber(t, 1);
	return t;
}

function unFlattenNumberedTree(rows)
{
	/* jshint maxdepth:4 */

	rows = _.sortBy(rows, function (row) {
		return -row.lft;
	});

	var stack = [];
	for (var r = 0, l = rows.length; r < l; ++r) {
		
		var row = rows[r];
		
		if (r > 0 && row.lft + 1 === stack[0].lft) {
			for (var n = 0, stackLen = stack.length; n < stackLen; ++n) {
				var rgt = stack[n].rgt;
				if (rgt + 1 === row.rgt) {
					row.children = stack.splice(0, n + 1);
					break;
				}
			}
		}

		stack.unshift(row);
	}

	return stack[0];
}

function getNodesAtDepth(t, depth) {
	if (depth < 1) {
		return [];
	} else if (depth === 1) {
		return [t];
	} else {
		if (!t.children) {
			return [];
		} else {
			return t.children.reduce(function (prev, current) {
				return prev.concat(getNodesAtDepth(current, depth - 1));
			}, []);
		}
	}
}

function _getNodeAtPath(t, path) {
	var current = path.shift();
	if (!current) {
		return null;
	}
	if (t.name !== current) {
		return null;
	}

	if (path.length === 0) {
		return t;
	}

	if (t.children) {
		for (var i = 0, len = t.children.length; i < len; ++i) {
			var node = getNodeAtPath(t.children[i], path);
			if (node) {
				return node;
			}
		}
	}

	return null;
}

function getNodeAtPath(t, path) {
	return _getNodeAtPath(t, path.slice(0));
}

function reduce(t, red, initialValue) {
	initialValue = red(initialValue, t);

	if (t.children) {
		initialValue = t.children.reduce(function (soFar, node) {
			return reduce(node, red, soFar);
		}, initialValue);
	}

	return initialValue;
}

exports.makeNode = makeNode;
exports.makeTreeFromPath = makeTreeFromPath;
exports.mergeTrees = mergeTrees;
exports.mergePath = mergePath;
exports.flatten = flatten;
exports.number = number;
exports.unFlattenNumberedTree = unFlattenNumberedTree;
exports.getNodesAtDepth = getNodesAtDepth;
exports.reduce = reduce;
exports.getNodeAtPath = getNodeAtPath;
