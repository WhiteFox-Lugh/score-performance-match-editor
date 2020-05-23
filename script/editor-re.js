const LEGER_WIDTH = 1;
const PX_PER_SEC = 200;
const X_OFFSET = 100; // X 座標左端
const TAB = String.fromCharCode(9);
const SPACE = String.fromCharCode(32);

// fmt3x 描画関連定数
const SEC_PER_LINE = 9999;
const GRACE_NOTE_DURATION = 0.07;

// match 描画関連定数
const REGION_DIFF = 0.3;

// 描画関連
let heightUnit = 10;
let widthAmp = 1.0;
let heightAmp = 1.0;
let amplifiedWidth = PX_PER_SEC * widthAmp;
let yOffsetFmt3x = 50; // 五線譜の Y 座標上端（fmt3x） 
let yOffsetMatch = 253; // 五線譜の Y 座標上端（match）
let heightPerLine = 3 * yOffsetFmt3x + 20 * heightUnit; // widthLast にあたる const
let heightC4Fmt = 100; // C4 の位置(ト音記号の場合)
let heightC4Match = 303; // C4 の位置(ト音記号の場合)
let staffLineSpace = 20; // 五線譜の上段と下段の間隔
let maxTime = 2.1;
let windowWidth = X_OFFSET + maxTime * amplifiedWidth;
let fmtEventsArray = [];
let fmtCommentsArray = [];
let fmtVersion = "";
let fmtTPQN = 4;
let matchEventsArray = [];
let matchCommentsArray = [];
let missingNotesArray = [];
let idToFmtPos = new Map();
let missingIDSet = new Set();


/**
 * fmt ファイルの読み込み
 * @param {File} file 読み込む fmt3x ファイル
 */
function readFmtFile(file){
	const TPQN = "//TPQN:";
	const VERSION = "//Fmt3xVersion:";
	const DUPLICATE = "//DuplicateOnsets:";
	const FMTVERSION = "170225";

	let reader = new FileReader();
	reader.readAsText(file);

	reader.onload = function(){
		fmtEventsArray = [];
		let fileContent = reader.result.split(/\n/);
		let len = fileContent.length;

		for (let i = 0; i < len; i++){
			// TPQN の読み込み
			if (fileContent[i].match(TPQN)){
				let tpqnData = (fileContent[i].split(SPACE))[1];
				fmtTPQN = tpqnData;
			}
			// バージョン情報の読み込み
			else if (fileContent[i].match(VERSION)){
				let versionData = (fileContent[i].split(SPACE))[1];
				if (!versionData.match(FMTVERSION)){
					console.log("Warning: The fmt3x version is not " + FMTVERSION + ".");
				}
				fmtVersion = versionData;
			}
			// duplicate の情報
			else if (fileContent[i].match(DUPLICATE)){
				console.log("Warning: DuplicateOnsets is NotImplemented.");
			}
			// comment の読み込み
			else if (fileContent[i][0] == "/" || fileContent[i][0] == "#"){
				let commentData = fileContent[i];
				fmtCommentsArray.push(commentData);
			}
			// 通常ノートの読み込み
			else {
				let fmtEvt=new Fmt3xEvent();
				fmtEvt.fromFileEvt(fileContent[i].split(/\s+/));
				fmtEventsArray.push(fmtEvt);
			}
		}
		// 五線譜への描画
		drawScore();
	}
	return;
}


/**
 * match ファイルの読み込み
 * @param {File} file 読み込む match ファイル
 */
function readMatchFile(file){
	const MISSING = "Missing";

	let reader = new FileReader();
	reader.readAsText(file);

	reader.onload = function(){
		matchEventsArray = [];
		matchCommentsArray = [];
		missingNotesArray = [];
		let fileContent = reader.result.split(/\n/);

		for (let i=0, len = fileContent.length; i<len; i++){
			// comment の読み込み
			if (!fileContent[i].match(MISSING) && (fileContent[i][0] == "/" || fileContent[i][0] == "#")){
				let commentData = fileContent[i];
				matchCommentsArray.push(commentData);
			}
			// Missing Note の読み込み
			else if(fileContent[i].match(MISSING)){
				let missingEvt = new MissingNote();
				let events = fileContent[i].split(/\s+/);
				missingEvt.readFromFile(events);
				missingNotesArray.push(missingEvt);
			}
			// 通常ノートの読み込み
			else {
				let matchEvt = new ScorePerfmMatchEvt();
				matchEvt.fromFileEvt(fileContent[i].split(/\s+/));
				matchEventsArray.push(matchEvt);
			}
		}
		// maxTime の更新
		let lastIdx = matchEventsArray.length - 1;
		if (matchEventsArray[lastIdx].offTime + 3 > maxTime){
			maxTime = matchEventsArray[lastIdx].offTime + 3;
		}
		// 五線譜への描画
		drawScore();
	}
	return;
}


/**
 * 五線譜を描く
 * @param {*} mysvg HTML 内の mysvg
 */
function drawScoreBase(mysvg){
	const LINE_START_X = 0;
	let width = X_OFFSET + maxTime * amplifiedWidth;
	let ret = "";

	// 五線譜の描画部分
	for (let i = 0; i < 5; i++){
		// fmt3x 上段
		let fmt3xUpperLine = document.createElementNS('http://www.w3.org/2000/svg','line');
		fmt3xUpperLine.setAttribute('x1', LINE_START_X);
		fmt3xUpperLine.setAttribute('x2', width);
		fmt3xUpperLine.setAttribute('y1', yOffsetFmt3x + heightUnit * i);
		fmt3xUpperLine.setAttribute('y2', yOffsetFmt3x + heightUnit * i);
		fmt3xUpperLine.setAttribute('stroke','rgba(0, 0, 0, 0.5)');
		fmt3xUpperLine.setAttribute('stroke-width', 1);
		mysvg.appendChild(fmt3xUpperLine);
		// fmt3x 下段
		let fmt3xLowerLine = document.createElementNS('http://www.w3.org/2000/svg','line');
		fmt3xLowerLine.setAttribute('x1', LINE_START_X);
		fmt3xLowerLine.setAttribute('x2', width);
		fmt3xLowerLine.setAttribute('y1', yOffsetFmt3x + staffLineSpace + heightUnit * (i + 5));
		fmt3xLowerLine.setAttribute('y2', yOffsetFmt3x + staffLineSpace + heightUnit * (i + 5));
		fmt3xLowerLine.setAttribute('stroke','rgba(0, 0, 0, 0.5)');
		fmt3xLowerLine.setAttribute('stroke-width', 1);
		mysvg.appendChild(fmt3xLowerLine);
		// match 上段
		let matchUpperLine = document.createElementNS('http://www.w3.org/2000/svg','line');
		matchUpperLine.setAttribute('x1', LINE_START_X);
		matchUpperLine.setAttribute('x2', width);
		matchUpperLine.setAttribute('y1', yOffsetMatch + heightUnit * i);
		matchUpperLine.setAttribute('y2', yOffsetMatch + heightUnit * i);
		matchUpperLine.setAttribute('stroke','rgba(0, 0, 0, 0.5)');
		matchUpperLine.setAttribute('stroke-width', 1);
		mysvg.appendChild(matchUpperLine);
		// match 下段
		let matchLowerLine = document.createElementNS('http://www.w3.org/2000/svg','line');
		matchLowerLine.setAttribute('x1', LINE_START_X);
		matchLowerLine.setAttribute('x2', width);
		matchLowerLine.setAttribute('y1', yOffsetMatch + staffLineSpace + heightUnit * (i + 5));
		matchLowerLine.setAttribute('y2', yOffsetMatch + staffLineSpace + heightUnit * (i + 5));
		matchLowerLine.setAttribute('stroke','rgba(0, 0, 0, 0.5)');
		matchLowerLine.setAttribute('stroke-width', 1);
		mysvg.appendChild(matchLowerLine);
	}
	// 小節線と小節番号の描画
	for(let t = 0; t < maxTime; t++){
		let lineLeft = t * amplifiedWidth + X_OFFSET;
		let lineTopFmt = yOffsetFmt3x - LEGER_WIDTH * heightAmp;
		let lineTopMatch = yOffsetMatch - LEGER_WIDTH * heightAmp;
		let lineHeight = 12 * heightUnit;
		let fontSize = 10 * heightAmp;
		ret += '<div style="position:absolute; left:'+(lineLeft - LEGER_WIDTH)+'px; top:'+lineTopFmt+'px; width:0px; height:'+lineHeight+'px; border:'+LEGER_WIDTH+'px solid rgba(30,120,255,0.3);"></div>';
		ret += '<div style="position:absolute; left:'+(lineLeft - 6)+'px; top:'+(lineTopFmt - 20)+'px; width:0px; height:0px; color:rgba(30,120,255,1); font-size:'+fontSize+'px">'+t+'</div>';
		ret += '<div style="position:absolute; left:'+(lineLeft - LEGER_WIDTH)+'px; top:'+lineTopMatch+'px; width:0px; height:'+lineHeight+'px; border:'+LEGER_WIDTH+'px solid rgba(30,120,255,0.3);"></div>';
		ret += '<div style="position:absolute; left:'+(lineLeft - 6)+'px; top:'+(lineTopMatch - 20)+'px; width:0px; height:0px; color:rgba(30,120,255,1); font-size:'+fontSize+'px">'+t+'</div>';
	}
	
	// ト音記号とヘ音記号の描画
	let gclefHeight = 7.5 * heightUnit;
	let fclefHeight = 3.4 * heightUnit;
	let gclefTopFmt = heightC4Fmt - 6.5 * heightUnit;
	let fclefTopFmt = heightC4Fmt + 1.9 * heightUnit;
	let gclefTopMatch = heightC4Match - 6.5 * heightUnit;
	let fclefTopMatch = heightC4Match + 1.9 * heightUnit;
	ret += '<img src="img/Gclef.png" height='+gclefHeight+' style="position:absolute; left:5px; top:'+gclefTopFmt+'px;"/>';
	ret += '<img src="img/Fclef.png" height='+fclefHeight+' style="position:absolute; left:8px; top:'+fclefTopFmt+'px;"/>';
	ret += '<img src="img/Gclef.png" height='+gclefHeight+' style="position:absolute; left:5px; top:'+gclefTopMatch+'px;"/>';
	ret += '<img src="img/Fclef.png" height='+fclefHeight+' style="position:absolute; left:8px; top:'+fclefTopMatch+'px;"/>';
	
	return ret;
}


/**
 * 臨時記号を楽譜上に描画する
 * @param {Number} accidental 臨時記号に対応する値
 * @param {Number} leftPos 左端座標
 * @param {Number} topPos 上端座標
 */
function drawAccidentalMark(accidental, leftPos, topPos){
	let ret = "";
	if (accidental == 1){
		ret += '<img src="img/Sharp.png" height="'+(2 * heightUnit)+'" style="position:absolute; left:'+(leftPos - 9)+'px; top:'+(topPos - 0.4 * heightUnit)+'px;"/>';
	}
	else if (accidental == 2){
		ret += '<img src="img/DoubleSharp.png" height="'+heightUnit+'" style="position:absolute; left:'+(leftPos - 12)+'px; top:'+(topPos - 1 + 0.1 * heightUnit)+'px;"/>';
	}
	else if (accidental == -1){
		ret += '<img src="img/Flat.png" height="'+(1.7 * heightUnit)+'" style="position:absolute; left:'+(leftPos - 9)+'px; top:'+(topPos - 0.5 - 0.6 * heightUnit)+'px;"/>';
	}
	else if (accidental == -2){
		ret += '<img src="img/DoubleFlat.png" height="'+(1.7 * heightUnit)+'" style="position:absolute; left:'+(leftPos - 14)+'px; top:'+(topPos - 1 - 0.6 * heightUnit)+'px;"/>';
	}
	return ret;
}


/**
 * segmentID の配列を得る（fmt3x 描画の補助関数）
 */
function fmtGetSetmentIds(){
	const SEGMENT_OFFSET = 0;
	const SEGMENT_SIZE = 30;
	const MATCH_EVENT_LENGTH = matchEventsArray.length;
	let ret = [];

	for (let i = 0; i <= MATCH_EVENT_LENGTH; i++){
		if(i == 0 || i == MATCH_EVENT_LENGTH){
			ret.push(i);
			continue;
		}

		let matchEvt = matchEventsArray[i];
		let skipInd = matchEvt.skipInd;

		if (skipInd !== "-" && skipInd !== "+"){
			ret.push(i);
		}

		if (i % SEGMENT_SIZE == SEGMENT_OFFSET){
			for (let j = i; j < i + Math.floor(SEGMENT_SIZE / 2) && j < MATCH_EVENT_LENGTH; j++){
				if(matchEventsArray[j].errorInd > 1){
					continue;
				}
				if(matchEventsArray[j].sTime != matchEventsArray[j - 1].sTime){
					ret.push(j);
					break;
				}
			}
		}
	}

	return ret;
}


/**
 * error indicator から error region を得る
 */
function fmtGetErrorRegions(){
	const MATCH_EVENT_LENGTH = matchEventsArray.length;
	let ret = [];

	for (let i = 0; i < MATCH_EVENT_LENGTH; i++){
		let matchEvt = matchEventsArray[i];
		if (matchEvt.errorInd > 0){
			let t1 = matchEvt.onTime - REGION_DIFF;
			let t2 = matchEvt.onTime + REGION_DIFF;
			ret.push([t1, t2]);
		}
	}
	return ret;
}


/**
 * 装飾音符の Error region を得る
 * @param {*} drawedScores 
 * @param {*} minTRef 
 * @param {*} minSTime 
 * @param {*} tempo 
 */
function getFmtOrnamentedErrorRegions(drawedScores, minTRef, minSTime, tempo){
	let ret = [];
	for (let i = 0; i < drawedScores.length; i++){
		let sEvt = drawedScores[i];
		let evtNoteTypeArray = sEvt.noteTypes;
		for (let j = 0; j < sEvt.numNotes; j++){
			let evtNoteType = evtNoteTypeArray[j];
			let noteTypeSubstr = evtNoteType.substring(0, evtNoteType.indexOf('.'));
			if (noteTypeSubstr != "N"){
				let t = minTRef + (sEvt.sTime - minSTime) * tempo + sEvt.subOrder * GRACE_NOTE_DURATION;
				let t1 =  t - REGION_DIFF;
				let t2 =  t + REGION_DIFF;
				ret.push([t1, t2]);
			}
		}
	}

	return ret;
}


/**
 * missing note の error region を取得
 * @param {*} minTref 
 * @param {*} minSTime 
 * @param {*} tempo 
 */
function fmtMissingNoteErrorRegions(minTRef, minSTime, maxSTime, tempo){
	let ret = [];
	for (let i = 0; i< missingNotesArray.length; i++){
		let missingEvt = missingNotesArray[i];
		let missingSTime = missingEvt.sTime;
		let missingID = missingEvt.ID;
		if (minSTime <= missingSTime && missingSTime <= maxSTime){
			let t = minTRef + (missingSTime - minSTime) * tempo;
			let t1 = t - REGION_DIFF;
			let t2 = t + REGION_DIFF;
			ret.push([t1, t2]);
		}
	}
	return ret;
}


/**
 * error region の描画
 * @param {Array<Region>} errorRegions : エラーリージョンの配列
 */
function drawErrorRegions(errorRegions){
	// 色は固定
	const REGION_COLOR = "background-color:rgba(255,255,0,0.15);"
	let ret = "";
	for (let item of errorRegions){
		let t1 = item[0];
		let t2 = item[1];
		let leftPos = X_OFFSET + amplifiedWidth * t1;
		let rightPos = X_OFFSET + amplifiedWidth * t2;
		let topPos = yOffsetFmt3x - 5 * staffLineSpace;
		let rectHeight = 25 * staffLineSpace;
		let rectWidth = rightPos - leftPos;
		ret += '<div style="position:absolute; left:'+leftPos+'px; top:'+topPos+'px; width:'+rectWidth+'px; height:'+rectHeight+'px; '+REGION_COLOR+'></div>';
	}
	return ret;
}


/**
 * fmt の minSTime 以上 maxStime 以下のスコアを得る
 * @param {Number} minSTime 
 * @param {Number} maxSTime 
 */
function getFmtSubScoreEvents(minSTime, maxSTime){
	let ret = [];
	for (let i = 0; i < fmtEventsArray.length; i++){
		let evt = fmtEventsArray[i];
		if (minSTime <= evt.sTime && evt.sTime <= maxSTime){
			ret.push(evt);
		}
	}
	return ret;
}


/**
 * 加線の描画
 * @param {*} sitchHeight 
 * @param {*} leftPos 
 */
function drawFmtLedgerLine(sitchHeight, leftPos){
	let ret = "";
	if (sitchHeight == 0){
		let topPos = heightC4Fmt - LEGER_WIDTH;
		ret += '<div style="position:absolute; left:'+leftPos+'px; top:'+topPos+'px; width:16px; height:0px; border:'+LEGER_WIDTH+'px solid rgba(0,0,0,1);"></div>';
	}
	else if (sitchHeight > 11){
		for (let h=12, end=sitchHeight;h<=end; h+=2){
			let topPos = heightC4Fmt - 0.5 * heightUnit * h - LEGER_WIDTH;
			ret += '<div style="position:absolute; left:'+leftPos+'px; top:'+topPos+'px; width:16px; height:0px; border:'+LEGER_WIDTH+'px solid rgba(0,0,0,1);"></div>';
		}
	}
	else if (sitchHeight < -11){
		for (let h=-12, end=sitchHeight; h>=end; h-=2){
			let topPos = heightC4Fmt - 0.5 * heightUnit * h - LEGER_WIDTH;
			ret += '<div style="position:absolute; left:'+leftPos+'px; top:'+topPos+'px; width:16px; height:0px; border:'+LEGER_WIDTH+'px solid rgba(0,0,0,1);"></div>';
		}
	}
	return ret;
}


/**
 * 楽譜表示用に ID を短縮する
 * @param {*} str : 元のID
 */
function simplifyFmtID(str){
	let ret = "";
	if (str[0] == "*" || str[0] == "&"){ret = str;}
	else if (str.substring(0, str.indexOf("-")) == "P1"){
		ret = str.substring(str.indexOf('-') + 1, str.length);
	}
	else {
		ret = str;
	}
	return ret;
}


/**
 * 楽譜上に fmt のノートを描画する
 */
function setFmtNote(onLine, onPos, offPos, ditchHeight, accidental, yOffset, fmtID, isMissingNote){
	let ret = "";
	// 臨時線の描画
	ret += drawFmtLedgerLine(ditchHeight, onPos);
	// ノートの描画
	let noteTopPos = onLine * heightPerLine + yOffset + 5 * heightUnit -
					 0.5 * heightUnit * (ditchHeight + 1);
	let noteWidth = offPos - onPos + 1;
	// map に座標を入れておく (fmtID -> (onPos_x, onPos_y))
	let fmtPos = [onPos, noteTopPos + heightUnit];
	idToFmtPos.set(fmtID, fmtPos);
	// 色は暫定で固定
	let frame = setFrameColor(isMissingNote ? -2 : 0);
	let noteColor = "background-color:rgba(255,80,180,0.4);"
	let frameDiff = isMissingNote ? 3 : 1;
	let simpleID = simplifyFmtID(fmtID);
	let fontSize = 7 * heightAmp;
	ret += '<div style="position:absolute; contentEditable=true; left:'+(onPos - frameDiff)+'px; top:'+(noteTopPos - frameDiff)+'px; width:'+noteWidth+'px; height:'+(heightUnit-1)+'px; '+frame+'"></div>';
	ret += '<div id="fmt'+fmtID+'" contentEditable=true style="position:absolute; left:'+onPos+'px; top:'+(noteTopPos)+'px; width:'+noteWidth+'px; height:'+(heightUnit-1)+'px; '+noteColor+' font-size:'+fontSize+'px;">'+simpleID+'</div>';
	// 臨時記号
	let accidentalLeftPos = onPos;
	let accidentalTopPosBase = -(1 + ditchHeight) * 5 + heightC4Fmt - 1;
	ret += drawAccidentalMark(accidental, accidentalLeftPos, accidentalTopPosBase);
	return ret;
}


/**
 * matching line の描画
 */
function drawMatchLine(){
	for (let i = 0; i < matchEventsArray.length; i++){
		let matchEvt = matchEventsArray[i];
		let evtID = matchEvt.fmtID;
		let evtOnTime = matchEvt.onTime;
		let matchSitch = matchEvt.sitch;
		let sitchHeight = sitchToSitchHeight(matchSitch);
		let scoreNotePos;
		if (!idToFmtPos.has(evtID) || evtID.match("\\*") || evtID.match("\\&")){
			continue;
		}
		scoreNotePos = idToFmtPos.get(evtID);
		let fmtXPos = scoreNotePos[0];
		let fmtYPos = scoreNotePos[1];
		let matchXPos = X_OFFSET + amplifiedWidth * evtOnTime;
		let matchYPos = -(1 + sitchHeight) * 5 * heightAmp + heightC4Match + heightUnit;
		let horizontalLen = Math.floor(0.6 * staffLineSpace);
		let p1 = (fmtXPos + horizontalLen) + "," + fmtYPos;
		let p2 = fmtXPos + "," + fmtYPos;
		let p3 = matchXPos + "," + matchYPos;
		let p4 = (matchXPos + horizontalLen) + "," + matchYPos;
		let pStr = p1 + " " + p2 + " " + p3 + " " + p4;
		let matchLine = document.createElementNS('http://www.w3.org/2000/svg','polyline');
		matchLine.setAttribute('points', pStr);
		matchLine.setAttribute('fill', 'none');
		matchLine.setAttribute('stroke', setMatchLineColor(sitchHeight));
		matchLine.setAttribute('stroke-width', LEGER_WIDTH);
		matchLine.setAttribute('id', 'matchline-' + evtID);
		mysvg.appendChild(matchLine);
	}
	return;
}


/**
 * fmt3x の楽譜のノートを描画する一連の手順からなる関数
 */
function drawFmtNote(){
	const STR_CHORD = "chord";
	const STR_REST = "rest";
	const STR_SHORT_APP = "short-app";
	const STR_TREMOLO = "tremolo";
	const STR_AFTERNOTE = "after-note";

	// ret に描くオブジェクトのタグの文字列をどんどん突っ込んでいく
	let ret = "";
	let endTime = -1000;
	let fmtEventSize = fmtEventsArray.length;
	let matchEventSize = matchEventsArray.length;

	// endtime の計算
	for (let i = 0; i < matchEventSize; i++){
		let matchOnTime = matchEventsArray[i].onTime;
		let matchOfftime = matchEventsArray[i].offTime;
		endTime = Math.max(endTime, matchOnTime, matchOfftime);
	}

	// missing note の map 作成
	for (let i = 0; i < missingNotesArray.length; i++){
		let missingID = missingNotesArray[i].fmtID;
		missingIDSet.add(missingID);
	}

	// perfmSegmentIds の取得
	let segmentIds = fmtGetSetmentIds();

	// errorRegion の取得 (overlap あり)
	let errorRegionsArray = fmtGetErrorRegions();

	// fmt セグメントごとの縮小率の計算
	// idToFmtPos は match の ID -> fmt ノートの座標をマッピングする
	let segmentIDSize = segmentIds.length;
	for (let i = 0; i < segmentIDSize - 1; i++){
		let maxSTime = -1;
		let minSTime = fmtEventsArray[fmtEventSize - 1].sTime + 1;
		let maxTRef = matchEventsArray[0].onTime;
		let minTRef = matchEventsArray[matchEventSize - 1].onTime;

		for (let j = segmentIds[i]; j <= segmentIds[i + 1] && j < matchEventSize; j++){
			let matchEvt = matchEventsArray[j];
			if (matchEvt.errorInd > 1){
				continue;
			}
			if (matchEvt.sTime > maxSTime){
				maxSTime = matchEvt.sTime;
				maxTRef = matchEvt.onTime;
			}
			if (matchEvt.sTime < minSTime){
				minSTime = matchEvt.sTime;
				minTRef = matchEvt.onTime;
			}
		}

		// vref に対応
		let tempo = (maxTRef - minTRef) / (maxSTime - minSTime);
		if (maxSTime < matchEventsArray[matchEventSize - 1].sTime){
			maxSTime--;
			maxTRef -= tempo;
		}

		// segment の情報から fmt の minSTime 以上 maxStime 以下のスコアを得る
		let drawedScores = getFmtSubScoreEvents(minSTime, maxSTime);

		// 装飾音符の error region を追加
		let ornamentErrorRegions = getFmtOrnamentedErrorRegions(drawedScores, minTRef, minSTime, tempo);
		errorRegionsArray = errorRegionsArray.concat(ornamentErrorRegions);

		// missing note の error region を追加
		let missingNoteErrorRegions = fmtMissingNoteErrorRegions(minTRef, minSTime, maxSTime, tempo);
		errorRegionsArray = errorRegionsArray.concat(missingNoteErrorRegions);

		for (let j = 0; j < drawedScores.length; j++){
			let drawedFmtEvt = drawedScores[j];
			let eventType = drawedFmtEvt.eventType;
			let numNotes = drawedFmtEvt.numNotes;
			let fmtSitchArray = drawedFmtEvt.sitches;
			let fmtSTime = drawedFmtEvt.sTime;
			let fmtSubOrder = drawedFmtEvt.subOrder;
			let fmtDur = drawedFmtEvt.duration;
			let fmtIDArray = drawedFmtEvt.fmtIDs;

			// eventType ごとに処理
			// rest : 休符
			// tremolo : トレモロ
			if (eventType.match(STR_REST) || eventType.match(STR_TREMOLO)){
				continue;
			}
			// chord : 通常の音符の場合
			else if (eventType.match(STR_CHORD)){
				for (let k = 0; k < numNotes; k++){
					// ノート情報取得
					let fmtSitch = fmtSitchArray[k];
					let fmtID = fmtIDArray[k];

					// initialize
					let isOrnament = false;
					let principleDitch = "";
					let auxiliaryDitch = ""; // ???
					let ornamentInd = ""; // ???

					// ornament
					if (fmtSitch.match(',')){
						isOrnament = true;
						principleDitch = fmtSitch.substring(0, fmtSitch.indexOf(','));
					}
					else {
						principleDitch = fmtSitch;
					}

					// 音名から楽譜上での位置、臨時記号フラグ抽出
					let ditchHeight = sitchToSitchHeight(principleDitch);
					let acc = sitchToAcc(principleDitch);
					// position の計算
					let onPos = X_OFFSET + amplifiedWidth *
								(minTRef + (fmtSTime - minSTime) * tempo + fmtSubOrder * GRACE_NOTE_DURATION);
					let offPos = X_OFFSET + amplifiedWidth *
								(minTRef + (fmtSTime + fmtDur - minSTime) * tempo);
					// missing かどうかのチェック
					let isMissingNote = missingIDSet.has(fmtID);

					// 描画
					ret += setFmtNote(0, onPos, offPos, ditchHeight, acc, yOffsetFmt3x, fmtID, isMissingNote);
				}
			}
			// short-apps or after-note
			else if(eventType.match(STR_SHORT_APP) || eventType.match(STR_AFTERNOTE)){
				for (let k = 0; k < numNotes; k++){
					// ノート情報取得
					let fmtID = fmtIDArray[k];
					let principleDitch = fmtSitchArray[k];
					// 音名から楽譜上での位置、臨時記号フラグ抽出
					let ditchHeight = sitchToSitchHeight(principleDitch);
					let acc = sitchToAcc(principleDitch);
					// position の計算
					let onPos = X_OFFSET + amplifiedWidth *
								(minTRef + (fmtSTime - minSTime) * tempo + fmtSubOrder * GRACE_NOTE_DURATION);
					let offPos = onPos + amplifiedWidth * GRACE_NOTE_DURATION;
					// missing かどうかのチェック
					let isMissingNote = missingIDSet.has(fmtID);

					// 描画
					ret += setFmtNote(0, onPos, offPos, ditchHeight, acc, yOffsetFmt3x, fmtID, isMissingNote);
				}
			}
		}
	}
	
	// matching line の描画
	drawMatchLine();

	// error region 関連
	let errorRegions = new Region(errorRegionsArray);
	errorRegions.removeOverlappingRegion();
	ret += drawErrorRegions(errorRegions.regions);
	
	return ret;
}


/**
 * match 系の情報を楽譜上に描く
 */
function drawMatchNote(){
	let ret = "";
	for (let i=0; i<matchEventsArray.length; i++){
		let matchEvent = matchEventsArray[i];
		let matchSitch = matchEvent.sitch;
		let matchOntime = matchEvent.onTime;
		let matchOfftime = matchEvent.offTime;
		let matchFmtID = matchEvent.fmtID;
		let matchChannel = matchEvent.channel;
		let matchErrorInd = matchEvent.errorInd;

		// 音名から楽譜上での縦の位置を決定
		let sitchHeight = sitchToSitchHeight(matchSitch);

		// 臨時線の有無を判定し、必要なら描画
		let leftPos = matchOntime * amplifiedWidth + X_OFFSET - 8;
		if (sitchHeight == 0){
			let topPos = heightC4Match - LEGER_WIDTH;
			ret += '<div style="position:absolute; left:'+leftPos+'px; top:'+topPos+'px; width:16px; height:0px; border:'+LEGER_WIDTH+'px solid rgba(0,0,0,1);"></div>';
		}
		else if (sitchHeight > 11){
			for (let h=12, end=sitchHeight;h<=end; h+=2){
				let topPos = heightC4Match - 0.5 * heightUnit * h - LEGER_WIDTH;
				ret += '<div style="position:absolute; left:'+leftPos+'px; top:'+topPos+'px; width:16px; height:0px; border:'+LEGER_WIDTH+'px solid rgba(0,0,0,1);"></div>';
			}
		}
		else if (sitchHeight < -11){
			for (let h=-12, end=sitchHeight; h>=end; h-=2){
				let topPos = heightC4Match - 0.5 * heightUnit * h - LEGER_WIDTH;
				ret += '<div style="position:absolute; left:'+leftPos+'px; top:'+topPos+'px; width:16px; height:0px; border:'+LEGER_WIDTH+'px solid rgba(0,0,0,1);"></div>';
			}
		}

		// ノートの描画
		let noteLeftPos = matchOntime * amplifiedWidth + X_OFFSET;
		let noteTopPos = -(1 + sitchHeight) * 5 * heightAmp + heightC4Match;
		let noteWidth = (matchOfftime - matchOntime) * amplifiedWidth;
		let noteColor = channelToColor(matchChannel);
		let frame = setFrameColor(matchErrorInd);
		let frameDiff = (matchErrorInd > 0) ? 3 : 1;
		let simpleID = simplifyFmtID(matchFmtID);
		let fontSize = 7 * heightAmp;
		ret += '<div style="position:absolute; contentEditable=true; left:'+(noteLeftPos - frameDiff)+'px; top:'+(noteTopPos - frameDiff)+'px; width:'+noteWidth+'px; height:'+(heightUnit-1)+'px; '+frame+'"></div>';
		ret += '<div id="fmt'+matchFmtID+'" contentEditable=true style="position:absolute; left:'+noteLeftPos+'px; top:'+(noteTopPos)+'px; width:'+noteWidth+'px; height:'+(heightUnit-1)+'px; '+noteColor+' font-size:'+fontSize+'px;">'+simpleID+'</div>';

		// 臨時記号の描画
		let accidental = sitchToAcc(matchSitch);
		let accidentalLeftPos = matchOntime * amplifiedWidth + X_OFFSET;
		let accidentalTopPosBase = -(1 + sitchHeight) * 5 + heightC4Match - 1;
		ret += drawAccidentalMark(accidental, accidentalLeftPos, accidentalTopPosBase);
	}

	return ret;
}


/**
 * 楽譜への描画を行う一連の動作からなるメソッド
 */
function drawScore(){
	document.getElementById('display').style.width = (window.innerWidth - 50) + 'px';
	document.getElementById('display').style.height = String(200 + yOffsetMatch) + 'px';
	windowWidth = X_OFFSET + maxTime * amplifiedWidth;
	windowHeight = yOffsetMatch + 40 * heightUnit * heightAmp;
	let str = "";
	document.getElementById('display').innerHTML='<svg id="mysvg" xmlns="http://www.w3.org/2000/svg" width='+(windowWidth+20)+' height='+windowHeight+'></svg>';

	// 五線譜の描画
	let lineStr = drawScoreBase(mysvg);
	str += lineStr;

	// マップの初期化
	idToFmtPos.clear();
	missingIDSet.clear();

	// match 系の描画
	if (matchEventsArray.length > 0){
		let matchStr = drawMatchNote(); 
		str += matchStr;

		// fmt 系の描画
		if (fmtEventsArray.length > 0){
			let fmtStr = drawFmtNote();
			str += fmtStr;
		}
	}
	document.getElementById('display').innerHTML += str;
	
	return;
}


/**
 * 倍率変更後などのオフセットの値をセットする
 */
function setOffsetValue(){
	amplifiedWidth = PX_PER_SEC * widthAmp;
	heightUnit = 10 * heightAmp;
	yOffsetFmt3x = 50 * heightAmp; // 五線譜の Y 座標上端（fmt3x） 
	yOffsetMatch = 250 * heightAmp; // 五線譜の Y 座標上端（match）
	heightPerLine = 3 * yOffsetFmt3x + 20 * heightUnit; // widthLast にあたる const
	heightC4Fmt = yOffsetFmt3x + 5 * heightUnit; // C4 の位置(ト音記号の場合)
	heightC4Match = yOffsetMatch + 5 * heightUnit; // C4 の位置(ト音記号の場合)
	staffLineSpace = 2 * heightUnit; // 五線譜の上段と下段の間隔
	return;
}


/**
 * fmt3x ファイル読み込み
 */
$("#filein1").change(function(event){
	let txtFile = event.target.files[0];
	let fileName = txtFile.name;
	widthAmp = 1.0;
	heightAmp = 1.0;
	readFmtFile(txtFile);
	document.getElementById('filename1').value = fileName;
});


/**
 * match ファイルの読み込みボックスからの処理
 */
$("#filein2").change(function(event){
	let txtFile = event.target.files[0];
	let fileName = txtFile.name;
	widthAmp = 1.0;
	heightAmp = 1.0;
	readMatchFile(txtFile);
	document.getElementById('filename2').value = fileName;
});


/**
 * 横幅縮小ボタンが押されたときの処理
 */
document.getElementById('shrinkButton').addEventListener('click', function(){
	let diff = (widthAmp > 0.5) ? 0.1 : 0;
	widthAmp -= diff;
	setOffsetValue();
	drawScore();
	let pos = (document.getElementById('display').scrollLeft + 500 - X_OFFSET) / (1 + diff) + X_OFFSET - 500;
	document.getElementById('display').scrollLeft = pos;
});


/**
 * 横幅拡大ボタンが押されたときの処理
 */
document.getElementById('enlargeButton').addEventListener('click', function(){
	let diff = (widthAmp < 3.0) ? 0.1 : 0;
	widthAmp += diff;
	setOffsetValue();
	drawScore();
	let pos = (1 + diff) * (document.getElementById('display').scrollLeft + 500 - X_OFFSET) + X_OFFSET - 500;
	document.getElementById('display').scrollLeft = pos;
});


/**
 * 縮小ボタンが押されたときの処理
 */
document.getElementById('minusButton').addEventListener('click', function(){
	let diff = (widthAmp > 0.5) ? 0.1 : 0;
	widthAmp -= diff;
	let diff_height = (heightAmp > 0.5) ? 0.1 : 0;
	heightAmp -= diff_height;
	setOffsetValue();
	drawScore();
	let pos = (document.getElementById('display').scrollLeft + 500 - X_OFFSET) / (1 + diff) + X_OFFSET - 500;
	document.getElementById('display').scrollLeft = pos;
});


/**
 * 拡大ボタンが押されたときの処理
 */
document.getElementById('plusButton').addEventListener('click', function(){
	let diff = (widthAmp < 3.0) ? 0.1 : 0;
	widthAmp += diff;
	let diff_height = (heightAmp < 3.0) ? 0.1 : 0;
	heightAmp += diff_height;
	setOffsetValue();
	drawScore();
	let pos = (1 + diff) * (document.getElementById('display').scrollLeft + 500 - X_OFFSET) + X_OFFSET - 500;
	document.getElementById('display').scrollLeft = pos;
});


/**
 * ページ読み込み時の初期化を行う
 */
function init(){
	console.log("Initialized");
	// 読み込んだファイル名の初期化
	document.getElementById('filename1').value = '';
	document.getElementById('filename2').value = '';
	// スコア描画
	drawScore();
	return;
}


/**
 * ページが読み込まれた時に読み込まれる
 */
window.onload = function(){
	init();
}
