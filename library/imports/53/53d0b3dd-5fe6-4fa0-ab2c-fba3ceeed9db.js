"use strict";
cc._RF.push(module, '53d0bPdX+ZPoKss+6PO7tnb', 'bgf_BeadTemplate');
// script/bgf_BottomPanel/bgf_BeadTemplate.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        bead: {
            default: [],
            type: cc.Sprite
        }
    },

    ctor: function ctor() {
        this.beadNo = { 0: -1, 1: -1, 2: -1, 3: -1, 4: -1, 5: -1 };
    },
    unuse: function unuse() {
        this.beadNo = { 0: -1, 1: -1, 2: -1, 3: -1, 4: -1, 5: -1 };
        for (var i = 0; i < this.bead.length; i++) {
            this.bead[i].spriteFrame = null;
        }
    },
    reuse: function reuse(data) {
        // console.log("data",data);
        this.bead[data.beadPosition].spriteFrame = data.beadSprite;
    },
    setNewSprite: function setNewSprite(target, data) {
        // console.log("target = ",target);
        // console.log("data = ",data);
        // console.log("this.bead = ",this.bead);
        this.bead[target].spriteFrame = data;
    },
    setBeadType: function setBeadType(data) {
        // const {beadPosition, beadNo} = data;
        var beadPosition = data.beadPosition;
        var beadNo = data.beadNo;
        // console.log('beadPosition = ',beadPosition);
        // console.log('beadNo = ',beadNo);
        // console.log('this.beadNo[beadPosition] = ',this.beadNo[beadPosition]);
        this.beadNo[beadPosition] = beadNo;
    },
    getBeadType: function getBeadType(data) {
        // const {beadPosition} = data;
        // console.log('this.beadNo[data] = ',this.beadNo[data]);
        return this.beadNo[data];
    }
});

cc._RF.pop();