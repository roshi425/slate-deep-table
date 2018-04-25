'use strict';

var TablePosition = require('../TablePosition');

/**
 * Move selection to {x,y}
 *
 * @param {Object} opts
 * @param {Slate.Change} change
 * @param {Number} x
 * @param {Number} y
 * @return {Slate.Change}
 */
function moveSelection(opts, change, x, y) {
    var value = change.value;
    var startBlock = value.startBlock,
        startOffset = value.startOffset;


    if (!TablePosition.isInCell(value, startBlock, opts)) {
        throw new Error('moveSelection can only be applied in a cell');
    }

    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;


    var row = table.nodes.get(y);
    var cell = row.nodes.get(x);

    // Calculate new offset
    if (startOffset > cell.length) {
        startOffset = cell.length;
    }

    return change.collapseToEndOf(cell).moveOffsetsTo(startOffset);
}

module.exports = moveSelection;