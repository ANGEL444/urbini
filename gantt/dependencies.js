var clicker = false;
var counter = 0;
var k       = 1;
var last    = null;

function showDeps(source, dep, numprojects) {
//  alert(source.substring(60));
  if (clicker) {
//    alert(numprojects);
//    alert("erasing " + (numprojects-1)*5);
    if (last != source) 
      counter = 0;
    counter++;
    if (last == source)
      last = null;
    for (var i = 1; i <= ((numprojects - 1)*5); i++) {
      visi('line' + i, 1);
//      alert("erasing " + "line" + i);
//      document.getElementById('line' + i).from = "0,0";
//      document.getElementById('line' + i).to   = "0,0";
    }
    k = 1;
  }

  if (!clicker && last == source) {
    if (counter%2 != 0) {
//      alert(source + " " + dep + " " + k);
      draw(source, dep, numprojects);
    }
  }

  if (last != source) {
    if (counter%2 != 0) {
      draw(source, dep, numprojects);
//    alert(source + " " + dep + " " + k);
    }
  }
  last = source;
  clicker = false;
  
  k += 5;
}

function visi(nr, i) {
  var hidden =  'hidden';
  var visible = 'visible';
	
  if (document.layers) {
    var style = document.layers[nr]; 
    var hidden = 'hide';
    var visible = 'show';	
  }
  else if (document.all)
    var style = document.all[nr].style;
  else if (document.getElementById) 
    var style = document.getElementById(nr).style;

  if (i == 0) 
    style.visibility = visible;
  else
    style.visibility = hidden;
}

function draw(source, dep, numprojects) {
      var td = document.getElementById("thisOne");
      var tdL = td.offsetLeft;
      while (td.offsetParent != null) {
	tdL += td.offsetParent.offsetLeft;
	td = td.offsetParent;      
      } 
      tdL += 10;

      var bar1 = document.getElementById(source);
      var i = bar1.offsetLeft;
      while (bar1.offsetParent != null) {
 	i += bar1.offsetParent.offsetLeft;
	bar1 = bar1.offsetParent;      
      }
//      alert("here1");

      bar1 = document.getElementById(source);
      if (bar1==null) {
//      	alert("bar1 is null, this is the id: " + source.substring(60));
      }
      var j = bar1.offsetTop + 10;
      while (bar1.offsetParent != null) {
	j += bar1.offsetParent.offsetTop;
	bar1 = bar1.offsetParent;      
      }

      var bar2 = document.getElementById(dep);
      if (bar2 == null) {
	alert("bar2 is null, this is the id: " + dep.substring(60));
      }

      if (bar2 != null) {
	var i1 = bar2.offsetLeft;
        while (bar2.offsetParent != null) {
  	  i1 += bar2.offsetParent.offsetLeft;
	  bar2 = bar2.offsetParent;      
        }
//        alert("here2");

        bar2 = document.getElementById(dep);
        var j1 = bar2.offsetTop;
        while (bar2.offsetParent != null) {
	  j1 += bar2.offsetParent.offsetTop;
  	  bar2 = bar2.offsetParent;      
        }
        j1 += 10;
      }

//      alert("here3");
//      document.getElementById('line' + k).from     = "" + i  + "," + (j);
//      document.getElementById('line' + k).to       = "" + tdL + "," + (j);
//      document.getElementById('line' + (k+1)).from = "" + tdL + "," + (j);
//      document.getElementById('line' + (k+1)).to   = "" + tdL + "," + (j1);
//      document.getElementById('line' + (k+2)).from = "" + tdL + "," + (j1);
//      document.getElementById('line' + (k+2)).to   = "" + i1 + "," + (j1);

	if (document.layers) {
		var style1 = document.layers['line' + k];
		var style2 = document.layers['line' + (k + 1)];
		var style3 = document.layers['line' + (k + 2)];
		var style4 = document.layers['line' + (k + 3)];
		var style5 = document.layers['line' + (k + 4)];
	}
	else if (document.all) {
		var style1 = document.all['line' + k].style;
		var style2 = document.all['line' + (k + 1)].style;
		var style3 = document.all['line' + (k + 2)].style;
		var style4 = document.all['line' + (k + 3)].style;
		var style5 = document.all['line' + (k + 4)].style;
        }
	else if (document.getElementById) {
		var style1 = document.getElementById('line' + k).style;
		var style2 = document.getElementById('line' + (k + 1)).style;
		var style3 = document.getElementById('line' + (k + 2)).style;
		var style4 = document.getElementById('line' + (k + 3)).style;
		var style5 = document.getElementById('line' + (k + 4)).style;
        }

	var temp = j;
	var temp1 = j1;
	if (j > j1) {
		temp = j1;
		temp1 = j;
	}

	for (var hello = 0; hello < 5; hello++) {
		visi('line' + (k + hello), 0);
	}

	style1.left = tdL + "px";
	style1.top = j + "px";
	style1.width = i - tdL;
	style1.height = 2;

	style2.left = tdL + "px";	
	style2.top = temp + "px";
	style2.width = 2;

//        alert("here4");

	if (bar2 != null) {
		style2.height = temp1 - temp;

		style3.left = tdL + "px";
		style3.top = j1 + "px";
		style3.width = i1 - tdL - 5;
		style3.height = 2;

		style4.left = tdL + i1 - tdL - 5 + "px";
		style4.top = j1 - 3 + "px";
		style4.width = 5;
		style4.height = 9;

		visi('line' + (k + 4), 1);
	}

	if (bar2 == null) {
	        var lo = document.getElementById("lastOne");
		var height = lo.height;
	        var last = lo.offsetTop;
	        while (lo.offsetParent != null) {
		  last += lo.offsetParent.offsetTop;
		  lo = lo.offsetParent;      
      	        } 
//		alert("here6");
//		alert(height);
	        last += 23;
//		alert(last);
		visi('line' + (k + 2), 1);
		visi('line' + (k + 3), 1);
		style2.height = last - temp;
		style5.left = tdL - 3;
		style5.top = j + last - temp + "px";
		style5.height = 5;
		style5.width = 9;
	}
}


function getStyle() {
  var style = null;
  if (document.layers) {
    style = document.layers[this]; 
  }
  else if (document.all)
    style = document.all[this].style;
  else if (document.getElementById) 
    style = document.getElementById(this).style;
  return style;  
}