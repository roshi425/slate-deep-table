'use strict';

var Slate = require('slate');
var Text = Slate.Text;

var _require = require('immutable'),
    List = _require.List;

var TablePosition = require('../TablePosition');

/**
 * Delete current column in a table
 *
 * @param {Object} opts
 * @param {Slate.Change} change
 * @param {Number} at
 * @return {Slate.Change}
 */
function removeColumn(opts, change, at) {
    var value = change.value;
    var startBlock = value.startBlock;


    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;


    if (typeof at === 'undefined') {
        at = pos.getColumnIndex();
    }

    var rows = table.nodes;

    // Remove the cell from every row
    if (pos.getWidth() > 1) {
        rows.forEach(function (row) {
            var cell = row.nodes.get(at);
            change.removeNodeByKey(cell.key, { normalize: false });
        });
    }
    // If last column, clear text in cells instead
    else {
            rows.forEach(function (row) {
                row.nodes.forEach(function (cell) {
                    // remove existing children
                    cell.nodes.forEach(function (node) {
                        change.removeNodeByKey(node.key, { normalize: false });
                    });
                    // add the empty child content node
                    var emptyChild = Slate.Block.create({
                        type: opts.typeContent,
                        nodes: [Text.fromJSON({
                            object: 'text',
                            text: ''
                        })]
                    });
                    change.insertNodeByKey(cell.key, 0, emptyChild);
                });
            });
        }

    // Replace the table
    return change;
}

module.exports = removeColumn;