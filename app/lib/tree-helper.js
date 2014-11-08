var _ = require('underscore');

function makeNode (item) {
	if (typeof item === 'string') {
		return {
			name: item
		};
	}

	return item;
}

function makeTreeFromPath (path) {
	var item, root;
	while ((item = path.pop())) {
		var node = makeNode(item);
		if (!root) {
			root = node;
		} else {
			node.children = [root];
			root = node;
		}
	}
	return root;
}

function mergeTrees (t, u) {
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
		t = _.extend(t, _.omit(u, 'children'));

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
						newChildren.push(mergeTrees(a, childrenOfU[a.name]));
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

exports.makeNode = makeNode;
exports.makeTreeFromPath = makeTreeFromPath;
exports.mergeTrees = mergeTrees;
exports.mergePath = mergePath;
exports.flatten = flatten;
exports.number = number;
exports.unFlattenNumberedTree = unFlattenNumberedTree;
