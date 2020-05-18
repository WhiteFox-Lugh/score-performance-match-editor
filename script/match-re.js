/**
 * match の各ノート情報を格納するクラス
 */
class ScorePerfmMatchEvt{
	constructor(){
		this.ID = "";
		this.onTime = 0.0;
		this.offTime = 0.0;
		this.sitch = "";
		this.onVel = 0;
		this.offVel = 0;
		this.channel = 0;
		this.matchStatus = 0;
		this.sTime = 0;
		this.fmtID = "";
		this.errorInd = 0;
		this.skipInd = "";
	}

	/**
	 * match ファイルから読み込みしたものを格納
	 * @param {Array} event 
	 */
	fromFileEvt(event){
		this.ID = String(event[0]);
		this.onTime = Number(event[1]);
		this.offTime = Number(event[2]);
		this.sitch = String(event[3]);
		this.onVel = Number(event[4]);
		this.offVel = Number(event[5]);
		this.channel = Number(event[6]);
		this.matchStatus = Number(event[7]);
		this.sTime = Number(event[8]);
		this.fmtID = String(event[9]);
		this.errorInd = Number(event[10]);
		this.skipInd = String(event[11]);
		return;
    }
}


/**
 * match ファイル内の missing note 情報を格納するノート
 */
class MissingNote{
	constructor(){
		this.sTime = 0;
		this.fmtID = "";
	}

	/**
	 * ファイルから読み込み
	 * @param {Array} event 
	 */
	readFromFile(event){
		this.sTime = Number(event[1]);
		this.fmtID = String(event[2]);
		return;
	}
}