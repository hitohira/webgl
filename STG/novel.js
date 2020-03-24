function drawText(str,color,top,size){
	const div = document.getElementById("text");
  div.style.color = color;
  div.style.top = top;
  div.style.fontSize = size;
  div.style.backgroundColor = "#ffffff88";
	div.innerHTML = str;
}


function drawTalk(talker,text){
  const talkerDiv = document.getElementById("talker");
  const contentDiv = document.getElementById("text");
  talkerDiv.innerHTML = talker;
  talkerDiv.style.backgroundColor = "#ffffff88";
  drawText(text,"red","650px","60px");
}

function clearText(){
  const talkerDiv = document.getElementById("talker");
  const contentDiv = document.getElementById("text");
  talkerDiv.innerHTML = "";
  talkerDiv.style.backgroundColor = "#00000000";
  contentDiv.innerHTML = "";
  contentDiv.style.backgroundColor = "#00000000";
}
