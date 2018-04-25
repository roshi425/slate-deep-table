'use strict';

var _require = require('immutable'),
    List = _require.List;

var TablePosition = require('../TablePosition');
var moveSelection = require('./moveSelection');
var createCell = require('../createCell');

/**
 * Insert a new column in current table
 *
 * @param {Object} opts
 * @param {Slate.Change} change
 * @param {Number} at
 * @return {Slate.Change}
 */
function insertColumn(opts, change, at) {
    var _change = change,
        value = _change.value;
    var startBlock = value.startBlock;


    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;


    if (typeof at === 'undefined') {
        at = pos.getColumnIndex() + 1;
    }

    // Insert the new cell
    table.nodes.forEach(function (row) {
        var newCell = createCell(opts);
        change = change.insertNodeByKey(row.key, at, newCell, { normalize: false });
    });

    // Update the selection (not doing can break the undo)
    return moveSelection(opts, change, pos.getColumnIndex() + 1, pos.getRowIndex());
}

module.exports = insertColumn;