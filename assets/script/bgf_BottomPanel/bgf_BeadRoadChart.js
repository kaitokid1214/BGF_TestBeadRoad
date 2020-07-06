import {first, last, filter, forEach, sortBy, map, difference} from 'lodash';

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
    ctor() {
        this.subscriberList = [];
        this.beadPool = null;
        this.roomId = null;
        this.totalBeads = 0;
        this.nowBeadArr = [];//目前珠路全盤圖
        this.nowRowCount = 0;//目前珠路列數量
        this.tempBead = [];
        this.nowRowPosition = 0;//目前所在的珠路哪一列
        this.nextPutRowPosition = 0;
        this.turnBeadNo = null;//珠子要轉彎的位置
    },
    onLoad() {
        this.beadContainer.removeAllChildren();//先全部清空
        this.beadPool = this.initRoomBeadPool();//初始化物件池
        this.blackBead = {beadPosition: 0, beadRow: null, isChangeColor: false};
        this.redBead = {beadPosition: 0, beadRow: null, isChangeColor: false};
        this.nowBeadPosition = 0;
        this.changeColorBeadPosition = 0;
        this.putBeadCount = 0;

        this.scrollView = this.node.getComponent(cc.ScrollView);


        for (let i = 0; i < 9; i++) {
            let beadPosition = 0;
            let beadSprite = null;
            let newBead = this.beadPool.get({beadPosition, beadSprite});
            // newBead.getComponent("bgf_BeadTemplate").setBeadType({beadPosition, beadNo});
            let beadName = i + 1;
            newBead.setName(`${beadName}`);
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

    onDestroy() {
    },

    onAllBeadBtnClick() {
        // 1-5
        let allBead = [];
        do {
            let result = Math.floor(Math.random() * 5) + 1;
            if (result !== 3) {
                let temp = [];
                temp.push(result);
                allBead.push(temp);
            }
        } while (allBead.length < 20);
        this.tempBead = allBead;
        this.onBeadRoadInfo(allBead);

        // this.onBeadRoadInfo([1,1,2]);
    },
    onRedBtnClick() {
        this.tempBead.push([2]);
        this.onBeadRoadInfo(this.tempBead);
    },
    onBlackBtnClick() {
        this.tempBead.push([1]);
        this.onBeadRoadInfo(this.tempBead);
    },
    onClearBtnClick() {
        this.beadContainer.removeAllChildren();//先全部清空
        this.beadPool = null;
        this.beadPool = this.initRoomBeadPool();//初始化物件池
        this.totalBeads = 0;
        this.nowBeadArr = [];//目前珠路全盤圖
        this.nowRowCount = 0;//目前珠路列數量
        this.nowRowPosition = 0;//目前所在的珠路哪一列
        this.turnBeadNo = null;//珠子要轉彎的位置
    },

    initRoomBeadPool() {
        let beadPool = new cc.NodePool('bgf_BeadTemplate');
        let roundCount = cc.sys.isNative ? this.totalRoadCount : (this.totalRoadCount + 4);
        for (let i = 0; i < roundCount; i++) {
            let sub = cc.instantiate(this.beadPrefab); // 创建节点
            beadPool.put(sub); // 通过 putInPool 接口放入对象池
        }
        return beadPool;
    },

    onBeadRoadInfo(evt) {
        // console.log('evt = ', evt);
        // console.log('this.nowBeadArr = ',this.nowBeadArr);
        this.totalBeads = evt.length;
        let differentBead = difference(evt, this.nowBeadArr);//比對全盤珠路與目前珠路差異
        // console.log("differentBead = ", differentBead);//全盤是新的的話,會印出全部;否則是只印出不一樣的一顆珠子
        for (let i = 0; i < differentBead.length; i++) {
            //將不同的珠路塞進去全盤珠路
            this.nowBeadArr.push(differentBead[i]);
        }

        // console.log('after push this.nowBeadArr = ',this.nowBeadArr);
        // console.log("differentBead = ", differentBead);//全盤是新的的話,會印出全部;否則是只印出不一樣的一顆珠子
        let isSameColorWithBefore = true;//後一顆珠子是否與前一顆珠子相同
        if (differentBead.length === 1 && this.totalBeads !== 1) {//如果差異珠子只有一顆,且總珠子大於一顆;表示非開新局
            isSameColorWithBefore =
                this.nowBeadArr[this.nowBeadArr.length - 1] % 3 === this.nowBeadArr[this.nowBeadArr.length - 2] % 3;
            // console.log('isSameColorWithBefore = ',isSameColorWithBefore);
            // console.log('differentBead[0] = ',differentBead[0]);
            //1(black) = 4(blackLucky) ; 2(red) = 5(redLucky) ; 沒有tie
            this.setNewBead(differentBead[0], isSameColorWithBefore);
        } else {
            this.putBeadCount = 0;
            //剛進房間,創全盤
            for (let i = 0; i < differentBead.length; i++) {
                if (i !== 0) isSameColorWithBefore =
                    this.nowBeadArr[i] % 3 === this.nowBeadArr[i - 1] % 3;
                this.setNewBead(differentBead[i], isSameColorWithBefore);
                this.putBeadCount++;
            }
        }
    },

    /**
     * 設定單一個珠子
     * @param bead 珠子種類
     * @param isSameColorWithBefore 是否與前一顆相同
     */
    setNewBead(bead, isSameColorWithBefore = true) {
        let beadNo = bead[0] === 1 || bead[0] === 4 ? 0 : 1;//0是黑, 1是紅

        let beadSprite = this._getBeadSprite(bead);//取得珠子spriteFrame

        // let isFirstTimeCreate = this.beadContainer.childrenCount === 0;//判斷是否為珠路盤剛初始化
        let isFirstTimeCreate = this.putBeadCount === 0;//判斷是否為珠路盤剛初始化

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

        const putBead = (beadObj, beadSprite, beadNo) => {
            const {beadPosition, beadRow, isChangeColor} = beadObj;
            this.nowBeadPosition = beadPosition;
            if (isChangeColor) {
                this.nowRowPosition = beadRow;
                this.nextPutRowPosition = beadRow + 1;
                if (this.changeColorBeadPosition > this.nowRowCount) {
                    let newBead = this.beadPool.get({beadPosition, beadSprite});
                    newBead.getComponent("bgf_BeadTemplate").setBeadType({beadPosition, beadNo});
                    newBead.setName(`${this.nowRowPosition}`);
                    newBead.parent = this.beadContainer;
                    this.nowRowCount++;
                    // createMoreThreeBeadRow();
                    // this.scrollView.scrollToRight(0.4);

                } else {
                    let oldNextBeadRow = this.beadContainer.getChildByName(`${beadRow}`);
                    if (oldNextBeadRow === null) {
                        oldNextBeadRow = this.beadContainer.children[0];
                        // console.log(oldNextBeadRow.name);
                        this.nowRowPosition = oldNextBeadRow.name * 1;
                        this.nextPutRowPosition = this.nowRowPosition + 1;
                        this.changeColorBeadPosition = this.nowRowPosition;
                    }
                    let beadRowTemplate = oldNextBeadRow.getComponent("bgf_BeadTemplate");
                    beadRowTemplate.setNewSprite(beadPosition, beadSprite);
                    beadRowTemplate.setBeadType({beadPosition, beadNo});
                }
                this.changeColorBeadPosition++;
            } else if (beadRow === this.nextPutRowPosition) {
                this.nowRowPosition = this.nextPutRowPosition;//1-base
                if (this.nextPutRowPosition > this.nowRowCount) {
                    let newBead = this.beadPool.get({beadPosition, beadSprite});
                    newBead.getComponent("bgf_BeadTemplate").setBeadType({beadPosition, beadNo});
                    newBead.setName(`${this.nowRowPosition}`);
                    newBead.parent = this.beadContainer;
                    this.nowRowCount++;
                    // createMoreThreeBeadRow();
                    // this.scrollView.scrollToRight(0.4);
                } else {
                    let oldNextBeadRow = this.beadContainer.getChildByName(`${beadRow}`);
                    let beadRowTemplate = oldNextBeadRow.getComponent("bgf_BeadTemplate");
                    beadRowTemplate.setNewSprite(beadPosition, beadSprite);
                    beadRowTemplate.setBeadType({beadPosition, beadNo});
                }
                this.nextPutRowPosition++;
            } else {
                let nowBeadRow = this.beadContainer.getChildByName(`${beadRow}`);
                let beadRowTemplate = nowBeadRow.getComponent("bgf_BeadTemplate");
                beadRowTemplate.setNewSprite(beadPosition, beadSprite);
                beadRowTemplate.setBeadType({beadPosition, beadNo});
            }
        };

        const getIsTurn = (beadObj, beadNo) => {

            let isTurn = false;
            const {beadRow} = beadObj;
            let nowBeadRow = this.beadContainer.getChildByName(`${beadRow}`);
            if (nowBeadRow === null) nowBeadRow = this.beadContainer.children[0];
            let beadTemplate = nowBeadRow.getComponent("bgf_BeadTemplate");

            //判斷下一顆有沒有珠子,以及珠子顏色
            let nextBead = this.nowBeadPosition + 1;
            if (beadTemplate.getBeadType(nextBead) !== -1 && beadTemplate.getBeadType(nextBead) !== beadNo) isTurn = true;

            //判斷前一row的下一顆有沒有珠子,以及顏色
            let beforeRow = this.beadContainer.getChildByName(`${beadRow - 1}`);
            if (beforeRow) {
                let beforeRowBeadTemplate = beforeRow.getComponent("bgf_BeadTemplate");
                if (beforeRowBeadTemplate.getBeadType(nextBead) === beadNo) isTurn = true;
            }

            //當row 未滿5顆, 要再加判斷下下一顆顏色
            if (this.nowBeadPosition < 4) {
                let nextTwoBead = this.nowBeadPosition + 2;
                if (beadTemplate.getBeadType(nextTwoBead) === beadNo) isTurn = true;
            }

            //在第一顆, 而且要前一row第一顆跟這顆同顏色 ==>必須修改下一次如果變色的擺放位置
            if (this.nowBeadPosition === 0 && beforeRow) {
                let beforeRowBeadTemplate = beforeRow.getComponent("bgf_BeadTemplate");
                if (beforeRowBeadTemplate.getBeadType(0) === beadNo) this.changeColorBeadPosition = this.nowRowPosition + 1;
            }

            return isTurn;
        };

        if (isFirstTimeCreate) {
            let beadPosition = 0;//同一個列中第幾顆珠子, 0~5
            this.nowRowPosition = 1;//1-base
            this.changeColorBeadPosition = 2;//1-base
            this.nextPutRowPosition = this.nowRowPosition + 1;
            this.nowBeadPosition = beadPosition;
            this.nowRowCount = this.beadContainer.childrenCount;
            if (this.beadContainer.childrenCount === 0) {

                let newBead = this.beadPool.get({beadPosition, beadSprite});
                newBead.getComponent("bgf_BeadTemplate").setBeadType({beadPosition, beadNo});
                this.nowRowCount++;
                newBead.setName(`${this.nowRowPosition}`);
                newBead.parent = this.beadContainer;

            } else {
                let beadRow = this.beadContainer.getChildByName(`${this.nowRowPosition}`);
                let beadRowTemplate = beadRow.getComponent("bgf_BeadTemplate");
                beadRowTemplate.setNewSprite(beadPosition, beadSprite);
                beadRowTemplate.setBeadType({beadPosition, beadNo});
            }

            if (beadNo === 0) {
                this.blackBead = {beadPosition: 1, beadRow: this.nowRowPosition, isChangeColor: false};
                this.redBead = {beadPosition: 0, beadRow: this.changeColorBeadPosition, isChangeColor: true};
            } else {
                this.blackBead = {beadPosition: 0, beadRow: this.changeColorBeadPosition, isChangeColor: true};
                this.redBead = {beadPosition: 1, beadRow: this.nowRowPosition, isChangeColor: false};
            }


        } else {
            let putBeadType = beadNo === 0 ? this.blackBead : this.redBead;
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
            let setBlackBead, setRedBead;

            if (this.nowBeadPosition === 5) {
                //一排滿了
                if (beadNo === 0) {
                    setBlackBead = {beadPosition: 5, beadRow: this.nextPutRowPosition, isChangeColor: false};
                    setRedBead = {beadPosition: 0, beadRow: this.changeColorBeadPosition, isChangeColor: true};
                } else {
                    setBlackBead = {beadPosition: 0, beadRow: this.changeColorBeadPosition, isChangeColor: true};
                    setRedBead = {beadPosition: 5, beadRow: this.nextPutRowPosition, isChangeColor: false};
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
                    setRedBead = {beadPosition: 0, beadRow: this.changeColorBeadPosition, isChangeColor: true};
                } else {
                    setBlackBead = {beadPosition: 0, beadRow: this.changeColorBeadPosition, isChangeColor: true};
                    setRedBead = {
                        beadPosition: this.nowBeadPosition,
                        beadRow: this.nowRowPosition,
                        isChangeColor: false
                    };
                }

            } else {
                let isTurn = getIsTurn(putBeadType, beadNo);
                if (beadNo === 0) {
                    setRedBead = {beadPosition: 0, beadRow: this.changeColorBeadPosition, isChangeColor: true};
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
                    setBlackBead = {beadPosition: 0, beadRow: this.changeColorBeadPosition, isChangeColor: true};
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
        let {children} = this.beadContainer;
        let isFull = cc.sys.isNative ? this.beadContainer.childrenCount : (this.beadContainer.childrenCount - 3);
        //列滿了更新
        if (isFull >= this.totalRoadCount) {
            this.beadPool.put(first(children));
        }



    },

    /**
     * 確認最後一顆是否與新的一顆顏色相同
     * @param now
     * @param last
     * @returns {boolean}
     * @private
     */
    _checkIsTheSame(now, last) {
        let isTheSame = false;

        return isTheSame;
    },

    /**
     * 取得珠子圖
     * @param beadType 珠子類型
     * @returns {cc.SpriteFrame | *}
     * @private
     */
    _getBeadSprite(beadType) {
        // console.log("beadType = ",beadType);
        let spriteName;
        const cases = {
            1: "bgf_black",
            2: "bgf_red",
            4: "bgf_blacklucky",
            5: "bgf_redlucky"
        };
        if (cases.hasOwnProperty(beadType)) {
            spriteName = cases[beadType];
        }
        let resultSriteFrame = this.beadSpriteAtlas.getSpriteFrame(spriteName);
        // if (beadType[0] === 1 || beadType[0] === 4) {
        //     resultSriteFrame.name = "0";//名字"0"是黑
        // } else if (beadType[0] === 2 || beadType[0] === 5) {
        //     resultSriteFrame.name = "1";//名字"1"是紅
        // }

        return resultSriteFrame;
    },

    _getNowBeadNo(beadType) {
        let beadNo;
        if (beadType[0] === 1 || beadType[0] === 4) {
            beadNo = 0;//0是黑
        } else if (beadType[0] === 2 || beadType[0] === 5) {
            beadNo = 1;//1是紅
        }
        return beadNo;
    }

});
