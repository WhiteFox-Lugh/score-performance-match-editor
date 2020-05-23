/**
 * match line に色を付ける（音によって変える）
 * @param {*} i 
 */
function setMatchLineColor(i){
	let n = (i % 7 < 0) ? ((i % 7) + 7) : (i % 7 + 0);
	let ret = "";
	if (n == 0){ret = "#CC00CC";}
	else if(n == 1){ret = "#6600CC";}
	else if(n == 2){ret = "#3366CC";}
	else if(n == 3){ret = "#339900";}
	else if(n == 4){ret = "#CC9900";}
	else if(n == 5){ret = "#CC6600";}
	else if(n == 6){ret = "#CC0000";}
	else {ret = "#000000"}
	return ret;
}


/**
 * ノートの色を決定する
 * @param {Number} channel チャンネル番号
 */
function channelToColor(channel){
	if (channel == 0){return "background-color:rgba(50,255,0,0.4); color:black;";}
	else if (channel == 1){return "background-color:rgba(255,120,30,0.4); color:blue;";}
	else if (channel == 2){return "background-color:rgba(255,30,120,0.4); color:aqua;";}
	else if (channel == 3){return "background-color:rgba(30,120,255,0.4); color:aqua;";}
	else if (channel == 4){return "background-color:rgba(120,30,120,0.4); color:aqua;";}
	else if (channel == 5){return "background-color:rgba(255,255,30,0.4); color:aqua;";}
	else if (channel == 6){return "background-color:rgba(30,255,255,0.4); color:aqua;";}
	else if (channel == 7){return "background-color:rgba(255,30,30,0.4); color:aqua;";}
	else if (channel == 8){return "background-color:rgba(120,30,30,0.4); color:aqua;";}
	else if (channel == 9){return "background-color:rgba(120,180,0,0.4); color:aqua;";}
	else if (channel == 10){return "background-color:rgba(30,180,180,0.4); color:aqua;";}
	else if (channel == 11){return "background-color:rgba(255,180,180,0.4); color:aqua;";}
	else {return "background-color:rgba(120,120,120,0.4); color:white;";}
}