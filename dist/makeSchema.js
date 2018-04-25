'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Slate = require('slate');
// const { SchemaViolations } = Slate;

var _require = require('immutable'),
    Range = _require.Range,
    List = _require.List;

var createCell = require('./createCell');
var createRow = require('./createRow');

var SchemaViolations = {
    ChildRequired: 'child_required',
    ChildObjectInvalid: 'child_object_invalid',
    ChildTypeInvalid: 'child_type_invalid',
    ParentTypeInvalid: 'parent_type_invalid'

    /**
     * convenience methods used below
     */

};var insertChild = function insertChild(change, ctx, type) {
    return change.insertNodeByKey(ctx.node.key, ctx.index, { object: 'block', type: type }, { normalize: false });
};

var removeChild = function removeChild(change, ctx) {
    return change.removeNodeByKey(ctx.child.key, { normalize: false });
};

var wrapWithParent = function wrapWithParent(change, ctx, type) {
    return change.wrapBlockByKey(ctx.node.key, type, { normalize: false });
};

/**
 * Create a schema for tables
 * @param {String} opts.typeTable The type of table blocks
 * @param {String} opts.typeRow The type of row blocks
 * @param {String} opts.typeCell The type of cell blocks
 * @param {String} opts.typeContent The default type of content blocks in cells
 * @return {Object} A schema definition with rules to normalize tables
 */
function makeSchema(opts) {
    var _blocks;

    var schema = {
        blocks: (_blocks = {}, _defineProperty(_blocks, opts.typeCell, {
            parent: { types: [opts.typeRow] },
            nodes: [{ objects: ['block'], min: 1 }],
            normalize: function normalize(change, reason, ctx) {
                // enforce cells must contain blocks, insert or wrap if not
                switch (reason) {
                    case SchemaViolations.ChildRequired:
                        return change.call(insertChild, ctx, opts.typeContent);

                    case SchemaViolations.ChildObjectInvalid:
                        // wrap non-block children with a block 
                        return change.insertNodeByKey(ctx.node.key, ctx.index, { object: 'block', type: opts.typeContent, nodes: ctx.node.nodes }, { normalize: false });

                    case SchemaViolations.ParentTypeInvalid:
                        return change.call(wrapWithParent, ctx, opts.typeRow);
                }
            }
        }), _defineProperty(_blocks, opts.typeRow, {
            parent: { types: [opts.typeTable] },
            nodes: [{ types: [opts.typeCell], objects: ['block'], min: 1 }],
            normalize: function normalize(change, reason, ctx) {
                // enforce rows must contain cells, drop all else 
                switch (reason) {
                    case SchemaViolations.ChildRequired:
                        return change.call(insertChild, ctx, opts.typeCell);

                    case SchemaViolations.ChildTypeInvalid:
                        return change.call(removeChild, ctx);

                    case SchemaViolations.ParentTypeInvalid:
                        return change.call(wrapWithParent, ctx, opts.typeTable);
                }
            }
        }), _defineProperty(_blocks, opts.typeTable, {
            nodes: [{ types: [opts.typeRow], objects: ['block'], min: 1 }],
            normalize: function normalize(change, reason, ctx) {
                // enforce rows must contain cells, drop all else 
                switch (reason) {
                    case SchemaViolations.ChildRequired:
                        return change.call(insertChild, ctx, opts.typeRow);

                    case SchemaViolations.ChildObjectInvalid:
                        return change.call(removeChild, ctx).call(insertChild, ctx, opts.typeRow);

                    case SchemaViolations.ChildTypeInvalid:
                        return change.call(removeChild, ctx);
                }
            }
        }), _blocks)
    };

    var isRow = function isRow(node) {
        return node.type === opts.typeRow;
    };
    var isCell = function isCell(node) {
        return node.type === opts.typeCell;
    };
    var countCells = function countCells(row) {
        return row.nodes.count(isCell);
    };

    var validateNode = function validateNode(node) {
        if (node.object != 'block') return;
        if (node.type !== opts.typeTable) return;

        var table = node;
        var rows = table.nodes.filter(isRow);

        // The number of column this table has
        var columns = rows.reduce(function (count, row) {
            return Math.max(count, countCells(row));
        }, 1); // Min 1 column

        var invalidRows = rows.map(function (row) {
            var cells = countCells(row);
            var invalids = row.nodes.filterNot(isCell);

            // Row is valid: right count of cells and no extra node
            if (invalids.isEmpty() && cells === columns) {
                return null;
            }

            // Otherwise, remove the invalids and append the missing cells
            return {
                row: row,
                invalids: invalids,
                add: columns - cells
            };
        }).filter(Boolean);

        if (invalidRows.size === 0) return;

        return function (change) {
            return invalidRows.reduce(function (tr, _ref) {
                var row = _ref.row,
                    invalids = _ref.invalids,
                    add = _ref.add;

                tr = invalids.reduce(function (t, child) {
                    return t.removeNodeByKey(child.key, { normalize: false });
                }, tr);

                tr = Range(0, add).reduce(function (t) {
                    var cell = createCell(opts);
                    return t.insertNodeByKey(row.key, 0, cell, { normalize: false });
                }, tr);

                return tr;
            }, change);
        };
    };

    return { schema: schema, validateNode: validateNode };
}

module.exports = makeSchema;