/**
 * エラーリージョン関連のクラス
 */
class Region {
    constructor(regionsArray){
        this.regions = regionsArray;
    }

    /**
     * リージョンのクリア
     */
    clearRegions(){
        this.regions = [];
        return;
    }

    /**
     * リージョンの追加
     * @param {Number} t1 
     * @param {Number} t2 
     */
    addRegion(t1, t2){
        if (t1 >= t2){
            return;
        }
        this.regions.add([t1, t2]);
        return;
    }

    debug(){
        console.log("Debug of regions");
        for (let item of this.regions){
            console.log(item);
        }
    }
}


/**
 * region のソート用関数
 * @param {Array<Array>} a 
 * @param {Array<Array>} b 
 */
function regionSortFunction(a, b){
    if (a[0] != b[0]){
        if (a[0] < b[0]){
            return -1;
        }
        else if(a[0] > b[0]){
            return 1;
        }
        return 0;
    }
    else {
        if(a[1] < b[1]){
            return -1;
        }
        else if(a[1] > b[1]){
            return 1;
        }
        else {
            return 0;
        }
    }
}