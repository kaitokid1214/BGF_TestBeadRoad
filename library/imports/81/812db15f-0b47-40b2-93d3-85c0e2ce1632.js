"use strict";
cc._RF.push(module, '812dbFfC0dAspPThcDizhYy', 'bgf_BeadRoadChart');
// script/bgf_BottomPanel/bgf_BeadRoadChart.js

'use strict';

var _lodash = require('lodash');

cc.Class({
    extends: cc.Component,

    properties: {
        totalRoadCount: {
            default: 18,
            type: cc.Integer
        },
        beadContainer: {
            default: null,
            type: cc.Node
        },
        beadPrefab: {
            default: null,
            type: cc.Prefab
        },
        beadSpriteAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },
        isHorizon: {
            default: true
        }
    },
    ctor: function ctor() {
        this.subscriberList = [];
        this.beadPool = null;
        this.roomId = null;
        this.totalBeads = 0;
        this.nowBeadArr = []; //目前珠路全盤圖
        this.nowRowCount = 0; //目前珠路列數量
        this.tempBead = [];
        this.nowRowPosition = 0; //目前所在的珠路哪一列
        this.nextPutRowPosition = 0;
        this.turnBeadNo = null; //珠子要轉彎的位置
    },
    onLoad: function onLoad() {
        this.beadContainer.removeAllChildren(); //先全部清空
        this.beadPool = this.initRoomBeadPool(); //初始化物件池
        this.blackBead = { beadPosition: 0, beadRow: null, isChangeColor: false };
        this.redBead = { beadPosition: 0, beadRow: null, isChangeColor: false };
        this.nowBeadPosition = 0;
        this.changeColorBeadPosition = 0;
        this.putBeadCount = 0;

        this.scrollView = this.node.getComponent(cc.ScrollView);

        for (var i = 0; i < 9; i++) {
            var beadPosition = 0;
            var beadSprite = null;
            var newBead = this.beadPool.get({ beadPosition: beadPosition, beadSprite: beadSprite });
            // newBead.getComponent("bgf_BeadTemplate").setBeadType({beadPosition, beadNo});
            var beadName = i + 1;
            newBead.setName('' + beadName);
            newBead.parent = this.beadContainer;
        }
        // this.scrollView.scrollToRight(0.4);
        // console.log(difference([2, 3, 4], [2, 3]));
        // this.ttt = 1;
        // let a = {test: this.ttt};
        // console.log(a);
        // this.ttt++;
        // console.log(a);
        // console.log(this.ttt);
    },
    onDestroy: function onDestroy() {},
    onAllBeadBtnClick: function onAllBeadBtnClick() {
        // 1-5
        var allBead = [];
        do {
            var result = Math.floor(Math.random() * 5) + 1;
            if (result !== 3) {
                var temp = [];
                temp.push(result);
                allBead.push(temp);
            }
        } while (allBead.length < 20);
        this.tempBead = allBead;
        this.onBeadRoadInfo(allBead);

        // this.onBeadRoadInfo([1,1,2]);
    },
    onRedBtnClick: function onRedBtnClick() {
        this.tempBead.push([2]);
        this.onBeadRoadInfo(this.tempBead);
    },
    onBlackBtnClick: function onBlackBtnClick() {
        this.tempBead.push([1]);
        this.onBeadRoadInfo(this.tempBead);
    },
    onClearBtnClick: function onClearBtnClick() {
        this.beadContainer.removeAllChildren(); //先全部清空
        this.beadPool = null;
        this.beadPool = this.initRoomBeadPool(); //初始化物件池
        this.totalBeads = 0;
        this.nowBeadArr = []; //目前珠路全盤圖
        this.nowRowCount = 0; //目前珠路列數量
        this.nowRowPosition = 0; //目前所在的珠路哪一列
        this.turnBeadNo = null; //珠子要轉彎的位置
    },
    initRoomBeadPool: function initRoomBeadPool() {
        var beadPool = new cc.NodePool('bgf_BeadTemplate');
        var roundCount = cc.sys.isNative ? this.totalRoadCount : this.totalRoadCount + 4;
        for (var i = 0; i < roundCount; i++) {
            var sub = cc.instantiate(this.beadPrefab); // 创建节点
            beadPool.put(sub); // 通过 putInPool 接口放入对象池
        }
        return beadPool;
    },
    onBeadRoadInfo: function onBeadRoadInfo(evt) {
        // console.log('evt = ', evt);
        // console.log('this.nowBeadArr = ',this.nowBeadArr);
        this.totalBeads = evt.length;
        var differentBead = (0, _lodash.difference)(evt, this.nowBeadArr); //比對全盤珠路與目前珠路差異
        // console.log("differentBead = ", differentBead);//全盤是新的的話,會印出全部;否則是只印出不一樣的一顆珠子
        for (var i = 0; i < differentBead.length; i++) {
            //將不同的珠路塞進去全盤珠路
            this.nowBeadArr.push(differentBead[i]);
        }

        // console.log('after push this.nowBeadArr = ',this.nowBeadArr);
        // console.log("differentBead = ", differentBead);//全盤是新的的話,會印出全部;否則是只印出不一樣的一顆珠子
        var isSameColorWithBefore = true; //後一顆珠子是否與前一顆珠子相同
        if (differentBead.length === 1 && this.totalBeads !== 1) {
            //如果差異珠子只有一顆,且總珠子大於一顆;表示非開新局
            isSameColorWithBefore = this.nowBeadArr[this.nowBeadArr.length - 1] % 3 === this.nowBeadArr[this.nowBeadArr.length - 2] % 3;
            // console.log('isSameColorWithBefore = ',isSameColorWithBefore);
            // console.log('differentBead[0] = ',differentBead[0]);
            //1(black) = 4(blackLucky) ; 2(red) = 5(redLucky) ; 沒有tie
            this.setNewBead(differentBead[0], isSameColorWithBefore);
        } else {
            this.putBeadCount = 0;
            //剛進房間,創全盤
            for (var _i = 0; _i < differentBead.length; _i++) {
                if (_i !== 0) isSameColorWithBefore = this.nowBeadArr[_i] % 3 === this.nowBeadArr[_i - 1] % 3;
                this.setNewBead(differentBead[_i], isSameColorWithBefore);
                this.putBeadCount++;
            }
        }
    },


    /**
     * 設定單一個珠子
     * @param bead 珠子種類
     * @param isSameColorWithBefore 是否與前一顆相同
     */
    setNewBead: function setNewBead(bead) {
        var _this = this;

        var isSameColorWithBefore = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

        var beadNo = bead[0] === 1 || bead[0] === 4 ? 0 : 1; //0是黑, 1是紅

        var beadSprite = this._getBeadSprite(bead); //取得珠子spriteFrame

        // let isFirstTimeCreate = this.beadContainer.childrenCount === 0;//判斷是否為珠路盤剛初始化
        var isFirstTimeCreate = this.putBeadCount === 0; //判斷是否為珠路盤剛初始化

        // const createMoreThreeBeadRow = ()=>{
        //     for(let i = 1 ; i < 4 ; i ++){
        //         let beadPosition = 0;
        //         let beadSprite = null;
        //         let newBead;
        //         // if(this.beadPool.size() > 0 ){
        //             newBead = this.beadPool.get({beadPosition, beadSprite});
        //         // }else{
        //         //     newBead = cc.instantiate(this.beadPrefab);
        //         //     this.beadPool.put(newBead);
        //         //     newBead = this.beadPool.get({beadPosition, beadSprite});
        //         // }
        //
        //         // newBead.getComponent("bgf_BeadTemplate").setBeadType({beadPosition, beadNo});
        //         let beadName = this.nowRowPosition + i;
        //         newBead.setName(`${beadName}`);
        //         newBead.parent = this.beadContainer;
        //         this.nowRowCount++;
        //     }
        // };

        var putBead = function putBead(beadObj, beadSprite, beadNo) {
            var beadPosition = beadObj.beadPosition,
                beadRow = beadObj.beadRow,
                isChangeColor = beadObj.isChangeColor;

            _this.nowBeadPosition = beadPosition;
            if (isChangeColor) {
                _this.nowRowPosition = beadRow;
                _this.nextPutRowPosition = beadRow + 1;
                if (_this.changeColorBeadPosition > _this.nowRowCount) {
                    var newBead = _this.beadPool.get({ beadPosition: beadPosition, beadSprite: beadSprite });
                    newBead.getComponent("bgf_BeadTemplate").setBeadType({ beadPosition: beadPosition, beadNo: beadNo });
                    newBead.setName('' + _this.nowRowPosition);
                    newBead.parent = _this.beadContainer;
                    _this.nowRowCount++;
                    // createMoreThreeBeadRow();
                    // this.scrollView.scrollToRight(0.4);
                } else {
                    var oldNextBeadRow = _this.beadContainer.getChildByName('' + beadRow);
                    if (oldNextBeadRow === null) {
                        oldNextBeadRow = _this.beadContainer.children[0];
                        // console.log(oldNextBeadRow.name);
                        _this.nowRowPosition = oldNextBeadRow.name * 1;
                        _this.nextPutRowPosition = _this.nowRowPosition + 1;
                        _this.changeColorBeadPosition = _this.nowRowPosition;
                    }
                    var beadRowTemplate = oldNextBeadRow.getComponent("bgf_BeadTemplate");
                    beadRowTemplate.setNewSprite(beadPosition, beadSprite);
                    beadRowTemplate.setBeadType({ beadPosition: beadPosition, beadNo: beadNo });
                }
                _this.changeColorBeadPosition++;
            } else if (beadRow === _this.nextPutRowPosition) {
                _this.nowRowPosition = _this.nextPutRowPosition; //1-base
                if (_this.nextPutRowPosition > _this.nowRowCount) {
                    var _newBead = _this.beadPool.get({ beadPosition: beadPosition, beadSprite: beadSprite });
                    _newBead.getComponent("bgf_BeadTemplate").setBeadType({ beadPosition: beadPosition, beadNo: beadNo });
                    _newBead.setName('' + _this.nowRowPosition);
                    _newBead.parent = _this.beadContainer;
                    _this.nowRowCount++;
                    // createMoreThreeBeadRow();
                    // this.scrollView.scrollToRight(0.4);
                } else {
                    var _oldNextBeadRow = _this.beadContainer.getChildByName('' + beadRow);
                    var _beadRowTemplate = _oldNextBeadRow.getComponent("bgf_BeadTemplate");
                    _beadRowTemplate.setNewSprite(beadPosition, beadSprite);
                    _beadRowTemplate.setBeadType({ beadPosition: beadPosition, beadNo: beadNo });
                }
                _this.nextPutRowPosition++;
            } else {
                var nowBeadRow = _this.beadContainer.getChildByName('' + beadRow);
                var _beadRowTemplate2 = nowBeadRow.getComponent("bgf_BeadTemplate");
                _beadRowTemplate2.setNewSprite(beadPosition, beadSprite);
                _beadRowTemplate2.setBeadType({ beadPosition: beadPosition, beadNo: beadNo });
            }
        };

        var getIsTurn = function getIsTurn(beadObj, beadNo) {

            var isTurn = false;
            var beadRow = beadObj.beadRow;

            var nowBeadRow = _this.beadContainer.getChildByName('' + beadRow);
            if (nowBeadRow === null) nowBeadRow = _this.beadContainer.children[0];
            var beadTemplate = nowBeadRow.getComponent("bgf_BeadTemplate");

            //判斷下一顆有沒有珠子,以及珠子顏色
            var nextBead = _this.nowBeadPosition + 1;
            if (beadTemplate.getBeadType(nextBead) !== -1 && beadTemplate.getBeadType(nextBead) !== beadNo) isTurn = true;

            //判斷前一row的下一顆有沒有珠子,以及顏色
            var beforeRow = _this.beadContainer.getChildByName('' + (beadRow - 1));
            if (beforeRow) {
                var beforeRowBeadTemplate = beforeRow.getComponent("bgf_BeadTemplate");
                if (beforeRowBeadTemplate.getBeadType(nextBead) === beadNo) isTurn = true;
            }

            //當row 未滿5顆, 要再加判斷下下一顆顏色
            if (_this.nowBeadPosition < 4) {
                var nextTwoBead = _this.nowBeadPosition + 2;
                if (beadTemplate.getBeadType(nextTwoBead) === beadNo) isTurn = true;
            }

            //在第一顆, 而且要前一row第一顆跟這顆同顏色 ==>必須修改下一次如果變色的擺放位置
            if (_this.nowBeadPosition === 0 && beforeRow) {
                var _beforeRowBeadTemplate = beforeRow.getComponent("bgf_BeadTemplate");
                if (_beforeRowBeadTemplate.getBeadType(0) === beadNo) _this.changeColorBeadPosition = _this.nowRowPosition + 1;
            }

            return isTurn;
        };

        if (isFirstTimeCreate) {
            var beadPosition = 0; //同一個列中第幾顆珠子, 0~5
            this.nowRowPosition = 1; //1-base
            this.changeColorBeadPosition = 2; //1-base
            this.nextPutRowPosition = this.nowRowPosition + 1;
            this.nowBeadPosition = beadPosition;
            this.nowRowCount = this.beadContainer.childrenCount;
            if (this.beadContainer.childrenCount === 0) {

                var newBead = this.beadPool.get({ beadPosition: beadPosition, beadSprite: beadSprite });
                newBead.getComponent("bgf_BeadTemplate").setBeadType({ beadPosition: beadPosition, beadNo: beadNo });
                this.nowRowCount++;
                newBead.setName('' + this.nowRowPosition);
                newBead.parent = this.beadContainer;
            } else {
                var beadRow = this.beadContainer.getChildByName('' + this.nowRowPosition);
                var beadRowTemplate = beadRow.getComponent("bgf_BeadTemplate");
                beadRowTemplate.setNewSprite(beadPosition, beadSprite);
                beadRowTemplate.setBeadType({ beadPosition: beadPosition, beadNo: beadNo });
            }

            if (beadNo === 0) {
                this.blackBead = { beadPosition: 1, beadRow: this.nowRowPosition, isChangeColor: false };
                this.redBead = { beadPosition: 0, beadRow: this.changeColorBeadPosition, isChangeColor: true };
            } else {
                this.blackBead = { beadPosition: 0, beadRow: this.changeColorBeadPosition, isChangeColor: true };
                this.redBead = { beadPosition: 1, beadRow: this.nowRowPosition, isChangeColor: false };
            }
        } else {
            var putBeadType = beadNo === 0 ? this.blackBead : this.redBead;
            putBead(putBeadType, beadSprite, beadNo);

            //web版要判斷最後三row是不是空白,不是的話要補足三row空白
            // if(!cc.sys.isNative && this.beadContainer.childrenCount < 21){
            //     let checkFirstRow = this.beadContainer.childrenCount - 2;
            //     let checkLastRow = this.beadContainer.childrenCount;
            //     for(let i =  checkFirstRow; i <= checkLastRow  ; i ++){
            //         let beadRow = this.beadContainer.getChildByName(`${i}`);
            //         let beadTemplate = beadRow.getComponent("bgf_BeadTemplate");
            //
            //         for(let j = 0 ; j < 5 ; j ++){
            //             if(beadTemplate.getBeadType(j) !== -1){
            //                 //表示該row 有珠子
            //                 //create empty row
            //                 let beadPosition = 0;
            //                 let beadSprite = null;
            //                 let newBead;
            //                 newBead = this.beadPool.get({beadPosition, beadSprite});
            //                 let beadName = this.beadContainer.childrenCount + 1;
            //                 console.log('beadName = ',beadName);
            //                 newBead.setName(`${beadName}`);
            //                 newBead.parent = this.beadContainer;
            //                 this.nowRowCount++;
            //                 break;
            //             }
            //         }
            //
            //     }
            //
            // }

            //判斷三個
            var setBlackBead = void 0,
                setRedBead = void 0;

            if (this.nowBeadPosition === 5) {
                //一排滿了
                if (beadNo === 0) {
                    setBlackBead = { beadPosition: 5, beadRow: this.nextPutRowPosition, isChangeColor: false };
                    setRedBead = { beadPosition: 0, beadRow: this.changeColorBeadPosition, isChangeColor: true };
                } else {
                    setBlackBead = { beadPosition: 0, beadRow: this.changeColorBeadPosition, isChangeColor: true };
                    setRedBead = { beadPosition: 5, beadRow: this.nextPutRowPosition, isChangeColor: false };
                }
            } else if (this.nowRowPosition === 1) {
                //還在初始第一排
                this.nowBeadPosition++;
                if (beadNo === 0) {
                    setBlackBead = {
                        beadPosition: this.nowBeadPosition,
                        beadRow: this.nowRowPosition,
                        isChangeColor: false
                    };
                    setRedBead = { beadPosition: 0, beadRow: this.changeColorBeadPosition, isChangeColor: true };
                } else {
                    setBlackBead = { beadPosition: 0, beadRow: this.changeColorBeadPosition, isChangeColor: true };
                    setRedBead = {
                        beadPosition: this.nowBeadPosition,
                        beadRow: this.nowRowPosition,
                        isChangeColor: false
                    };
                }
            } else {
                var isTurn = getIsTurn(putBeadType, beadNo);
                if (beadNo === 0) {
                    setRedBead = { beadPosition: 0, beadRow: this.changeColorBeadPosition, isChangeColor: true };
                    isTurn ? setBlackBead = {
                        beadPosition: this.nowBeadPosition,
                        beadRow: this.nextPutRowPosition,
                        isChangeColor: false
                    } : setBlackBead = {
                        beadPosition: ++this.nowBeadPosition,
                        beadRow: this.nowRowPosition,
                        isChangeColor: false
                    };
                } else {
                    setBlackBead = { beadPosition: 0, beadRow: this.changeColorBeadPosition, isChangeColor: true };
                    isTurn ? setRedBead = {
                        beadPosition: this.nowBeadPosition,
                        beadRow: this.nextPutRowPosition,
                        isChangeColor: false
                    } : setRedBead = {
                        beadPosition: ++this.nowBeadPosition,
                        beadRow: this.nowRowPosition,
                        isChangeColor: false
                    };
                }
            }

            this.blackBead = setBlackBead;
            this.redBead = setRedBead;
        }

        console.log('this.nowRowPosition = ', this.nowRowPosition);
        console.log('this.changeColorBeadPosition = ', this.changeColorBeadPosition);
        console.log('this.nextPutRowPosition = ', this.nextPutRowPosition);
        this.scrollView.scrollToRight(0.4);
        var children = this.beadContainer.children;

        var isFull = cc.sys.isNative ? this.beadContainer.childrenCount : this.beadContainer.childrenCount - 3;
        //列滿了更新
        if (isFull >= this.totalRoadCount) {
            this.beadPool.put((0, _lodash.first)(children));
        }
    },


    /**
     * 確認最後一顆是否與新的一顆顏色相同
     * @param now
     * @param last
     * @returns {boolean}
     * @private
     */
    _checkIsTheSame: function _checkIsTheSame(now, last) {
        var isTheSame = false;

        return isTheSame;
    },


    /**
     * 取得珠子圖
     * @param beadType 珠子類型
     * @returns {cc.SpriteFrame | *}
     * @private
     */
    _getBeadSprite: function _getBeadSprite(beadType) {
        // console.log("beadType = ",beadType);
        var spriteName = void 0;
        var cases = {
            1: "bgf_black",
            2: "bgf_red",
            4: "bgf_blacklucky",
            5: "bgf_redlucky"
        };
        if (cases.hasOwnProperty(beadType)) {
            spriteName = cases[beadType];
        }
        var resultSriteFrame = this.beadSpriteAtlas.getSpriteFrame(spriteName);
        // if (beadType[0] === 1 || beadType[0] === 4) {
        //     resultSriteFrame.name = "0";//名字"0"是黑
        // } else if (beadType[0] === 2 || beadType[0] === 5) {
        //     resultSriteFrame.name = "1";//名字"1"是紅
        // }

        return resultSriteFrame;
    },
    _getNowBeadNo: function _getNowBeadNo(beadType) {
        var beadNo = void 0;
        if (beadType[0] === 1 || beadType[0] === 4) {
            beadNo = 0; //0是黑
        } else if (beadType[0] === 2 || beadType[0] === 5) {
            beadNo = 1; //1是紅
        }
        return beadNo;
    }
});

cc._RF.pop();