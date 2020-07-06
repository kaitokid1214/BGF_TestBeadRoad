cc.Class({
    extends: cc.Component,

    properties: {
        bead: {
            default: [],
            type: cc.Sprite
        }
    },

    ctor() {
        this.beadNo = {0: -1, 1: -1, 2: -1, 3: -1, 4: -1, 5: -1};
    },

    unuse() {
        this.beadNo = {0: -1, 1: -1, 2: -1, 3: -1, 4: -1, 5: -1};
        for (let i = 0; i < this.bead.length; i++) {
            this.bead[i].spriteFrame = null;
        }
    },

    reuse(data) {
        // console.log("data",data);
        this.bead[data.beadPosition].spriteFrame = data.beadSprite;
    },

    setNewSprite(target, data) {
        // console.log("target = ",target);
        // console.log("data = ",data);
        // console.log("this.bead = ",this.bead);
        this.bead[target].spriteFrame = data;
    },
    
    setBeadType(data){
        // const {beadPosition, beadNo} = data;
        let beadPosition = data.beadPosition;
        let beadNo = data.beadNo;
        // console.log('beadPosition = ',beadPosition);
        // console.log('beadNo = ',beadNo);
        // console.log('this.beadNo[beadPosition] = ',this.beadNo[beadPosition]);
        this.beadNo[beadPosition] = beadNo;
    },
    
    getBeadType(data){
        // const {beadPosition} = data;
        // console.log('this.beadNo[data] = ',this.beadNo[data]);
        return this.beadNo[data];
    }
});
