'use strict';

var Slate = require('slate');
var Text = Slate.Text;

var TablePosition = require('../TablePosition');

/**
 * Remove current row in a table. Clear it if last remaining row
 *
 * @param {Object} opts
 * @param {Slate.Change} change
 * @param {Number} at
 * @return {Slate.Change}
 */
function removeRow(opts, change, at) {
    var value = change.value;
    var startBlock = value.startBlock;


    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;


    if (typeof at === 'undefined') {
        at = pos.getRowIndex();
    }

    var row = table.nodes.get(at);
    // Update table by removing the row
    if (pos.getHeight() > 1) {
        change.removeNodeByKey(row.key);
    }
    // If last remaining row, clear it instead
    else {
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
                change.insertNodeByKey(cell.key, 0, emptyChild, { normalize: false });
            });
        }

    return change;
}

module.exports = removeRow;