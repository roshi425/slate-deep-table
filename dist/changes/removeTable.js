'use strict';

var TablePosition = require('../TablePosition');

/**
 * Delete the whole table
 *
 * @param {Object} opts
 * @param {Slate.Change} change
 * @param {Number} at
 * @return {Slate.Change}
 */
function removeTable(opts, change, at) {
    var value = change.value;
    var startBlock = value.startBlock;


    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;
    var document = change.value.document;

    var nextFocusBlock = null;
    var shouldCollapseToEnd = false;

    var nextBlock = change.value.document.getNextBlock(table.key);
    if (nextBlock) {
        nextFocusBlock = nextBlock;
    } else {
        var prevBlock = change.value.document.getPreviousBlock(table.key);
        if (prevBlock) {
            nextFocusBlock = prevBlock;
            shouldCollapseToEnd = true;
        } else if (opts.exitBlockType) {
            nextFocusBlock = Block.create({
                type: opts.exitBlockType,
                nodes: [Text.create('')]
            });
            var tableParent = document.getParent(table.key);
            var insertionIndex = tableParent.nodes.indexOf(table) + 1;
            change.insertNodeByKey(tableParent.key, insertionIndex, nextFocusBlock);
        }
    }

    change.removeNodeByKey(table.key);
    if (!nextFocusBlock) {
        return change;
    }
    if (shouldCollapseToEnd) {
        change.collapseToEndOf(nextFocusBlock).focus();
    } else {
        change.collapseToStartOf(nextFocusBlock).focus();
    }
    return change;
}

module.exports = removeTable;