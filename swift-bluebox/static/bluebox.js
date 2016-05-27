/*
 * Project Bluebox
 * 2015, University of Stuttgart, IPVS/AS
 * 
 */

/* 
 *	Project Bluebox 
 *	
 *	Copyright (C) <2015> <University of Stuttgart>
 *	
 *	This software may be modified and distributed under the terms
 *	of the MIT license.  See the LICENSE file for details.
 */

/*
 * *********************************************************************
 * *********************************************************************
 * this gets called as soon as the browser has finished parsing the DOM
 * so this is the entry function
 * 
 * 
 */
var view;
var t = $("#swiftList");
$(document).ready(function() { 
	$("#logout").on('click',function(){
		$.removeCookie("BBOXSESSION");
		document.getElementById("containerDiv").style.display="none";
		document.getElementById("loginDiv").style.display="block";
	});
	checkForUser();
	buildContainerTable();
	$("#SuccessAlert").hide()
	$("#ErrorAlert").hide()
	uploadRequest();
	createRequest();
	$("#contSearch").val("");
	$("#containerTxt").val("")
	view = "container";
	

	$(window).scroll(function() {
		console.log("registered")
			if($(window).scrollTop() + $(window).height() == $(document).height()) {
				console.log("triggered");
				if(view == "container") {
					console.log("container view");
					buildContainerTableContent();
				} else if(view == "object") {
					console.log("object view");
					buildObjectTableContent();
				}
				// getLastObject();

			}
		})

});

function checkForUser(){
	try{
		var blueBoxSessionId= $.cookie("BBOXSESSION");
		
		if(blueBoxSessionId==undefined||blueBoxSessionId==null){
			document.getElementById("containerDiv").style.display="none";
			document.getElementById("loginDiv").style.display="block";
		}
		
		// alert(location.search);
	}catch(e){
		alert(JSON.stringify(e));
	}
}


function onLogin(){
	
	var username=$("#username").val();
	var password=$("#password").val();
	$.get("/users/login?user="+username+"&password="+password).success(function(data){
		alert(data);
		var response=eval('('+data+')');
		alert(response);
		if(response.status=="OK"){
			$.cookie("BBOXSESSION",response.user);
			// document.getElementById("containerDiv").style.display="block";
			// document.getElementById("loginDiv").style.display="none";
			location="/?user="+response.user;
		}else if(response.status=="NOT_FOUND"){
			alert("Invalid User, please register");
		}else{
			alert("Invalid Credentials Username or password is wrong");
		}
		
	}).fail(function(data){
		
		alert(JSON.stringify(data));
		
	});
}


function setObjectView() {
	view = "object";
}

function setContainerView() {
	view = "container";
}	
/*
 * *********************************************************************
 * ********************************************************************* clear
 * the entire table
 * 
 */
function clearSwiftTable(){
	$("#swiftList").children().remove();
}

/*
 * *********************************************************************
 * *********************************************************************
 * container table stuff
 * 
 */
var currentPageMarker = '';
 var currentPageObjectMarker = '';
 
 var container;
 
 
 function backToContainer() {
	 currentPageMarker = "";
	 buildContainerTable();
 }


 function buildContainerTable(){  
	 view = "container";
	clearSwiftTable();
	// getLastObject();
	currentPageMarker = '';

	$("#contSearch").val("");
    $("#objSearch").hide();
    $("#contSearch").show();
	$("#backBtn").hide()
	$("#demo5").hide()
	$("#demo6").hide()
	$("#demo7").hide()
	$("#createContainerDiv").show()
	$("#createContainerForm").show()
	$("#uploadObjectDiv").hide()
	$("#uploadObjectForm").hide()
	$("#checkOldFilesBtn").hide()
	$("#deleteOldFilesBtn").hide()
	$("#SuccessAlert").hide()
	$("#ErrorAlert").hide()
	
	$("#SwiftTableHeading h3").html("List of containers");
	
	
	buildContainerTableHeader();
	buildContainerTableContent();
	$(window).scrollTop(0);
}

function buildContainerTableHeader(){
	var table = $("#swiftList");
	// build header row
	var hr = $('<tr/>');
	hr.append($('<th/>').html("Name"));      // from container body
	hr.append($('<th/>').html("Size"));     // from container body
	hr.append($('<th/>').html("Objects")); // from container body
    hr.append($('<th/>').html("x-TimeStamp"));  // from container header
	hr.append($('<th/>').html("Enter")); 
    hr.append($('<th/>').html("Delete"));

	table.append(hr);
}

function buildContainerTableContent(){ 
$.ajax({
		url:"/swift/containers",
		headers:{"x-auth-token":$.cookie("BBOXSESSION")},
		data: {
			"marker": currentPageMarker}
		}).done(function(data){
		
		var table = $("#swiftList");
		
		document.getElementById("demo").innerHTML = "All content Showed";  // new
		for (var i = 0 ; i < data.length ; i++) {
			var row = $('<tr/>');
			 console.log(data[i].name);
			row.append($('<td/>').html(data[i].name));
			row.append($('<td/>').html(fileSizeSI(data[i].bytes)));
			row.append($('<td/>').html(data[i].count));
			row.append($('<td/>').html(data[i].Time));
            row.append($('<td/>')
				.html('<input type="button" class="btn btn-info" value=">>>" onclick="setObjectView()"/>')
				.data("containerName", data[i].name)
				.click(function() {enterContainer($(this))}));
			row.append($('<td/>')
					.html('<input type="button" class="btn btn-danger" value="DELETE"/>')
					.data("containerName", data[i].name)
					.click(function() {deleteContainer($(this))})
					);
			
			document.getElementById("demo").innerHTML = "Loading More";  // new
			table.append(row);
			currentPageMarker = data[i].name;
			console.log("currentPageMarker in build container table: " + currentPageMarker);
			
		}
		
	}).fail(function(data){
		alert(JSON.stringify(data));
	
	})
}

var containerName;
function enterContainer(d){
	container = d.data("containerName");
	containerName = container;
	buildObjectTable(container);
	
}
// for filter containers
var text;
function filterFunction() { 
	$.ajax({
		url:"/swift/containers/filtered",
		headers:{"x-auth-token":$.cookie("BBOXSESSION")},
		data: {"marker2": text}
		}).done(function(data){
	clearSwiftTable(); // to clear the page content
	var table = $("#swiftList");
	
	text = document.getElementById("contSearch").value; // value coming from
														// text box 
    getLastContainer();
    	//$.get("/swift/containers/filtered", {marker2: text}).success(function(data){
		console.log(data);
		for (var i = 0 ; i < data.length ; i++) {
			var row = $('<tr/>');
			row.append($('<td/>').html(data[i].name));
			row.append($('<td/>').html(fileSizeSI(data[i].bytes)));
			row.append($('<td/>').html(data[i].count));
			row.append($('<td/>').html(data[i].Time));
			row.append($('<td/>')
				.html('<input type="button" class="btn btn-info" value=">>>"/>')
				.data("containerName", data[i].name)
				.click(function() {enterContainer($(this))}));
			row.append($('<td/>')
					.html('<input type="button" class="btn btn-danger" value="DELETE"/>')
					.data("containerName", data[i].name)
					.click(function() {deleteContainer($(this))})
					);
				
			table.append(row);
		}
	})
	clearSwiftTable();
}
// used to bring last container
function getLastContainer() { 
	$.ajax({
		url:"/swift/containers/last",
		headers:{"x-auth-token":$.cookie("BBOXSESSION")}
		}).done(function(data){
	//$.get("/swift/containers/last").success(function(data){
		// currentPageMarker = '';
	for (var i = 0 ; i < data.length ; i++) {
		// console.log(data[i].name);
		currentPageMarker = data[i].name;
		}
	console.log("currentPageMarker in getLast:" + currentPageMarker);
})
   // console.log(currentPageMarker);
}
var text1;
function filterObjectFunction() { 
	
	$.ajax({
		url:"/swift/" +containerName+ "/filtered",
		headers:{"x-auth-token":$.cookie("BBOXSESSION")},
		data: {"marker4": text1}
		}).done(function(data){
			
	clearSwiftTable(); // to clear the page content
	
	var table = $("#swiftList");
	
    text1 = document.getElementById("objSearch").value; // value coming from
														// text box
    
    console.log(text1);
 
    buildObjectTableHeader(table);
  //  $.get("/swift/" +containerName+ "/filtered", {marker4: text1}).success(function(data){
    	 console.log(data);
		for (var i = 0 ; i < data.length ; i++) {           
		   var row = $('<tr/>');
		   console.log(data);
			// this information form objects body
			row.append($('<td/>').html(data[i].name));
			row.append($('<td/>').html(fileSizeSI(data[i].bytes)));
			row.append($('<td/>').html(data[i].content_type));
			row.append($('<td/>').html(data[i].last_modified)); 

			row.append($('<td/>')
					.html("<button type='button' class='btn btn-success'><span class='glyphicon glyphicon-download'></span> GET</button>")
					.data("containerName", containerName)
					.data("objectName", data[i].name)
					.click(function() {getObject($(this))})
					);
			row.append($('<td/>')
				.html("<button type='button' class='btn btn-danger'><span class='glyphicon glyphicon-remove-sign'></span> DELETE</button>")
				.data("containerName", containerName)
				.data("objectName", data[i].name)
				.click(function() {deleteObject($(this))})
				);
	
			row.append($('<td/>')
					.html("<button type='button' class='btn btn-info' data-toggle='collapse' data-target='#demo11'><span class='glyphicon glyphicon-info-sign'></span> DETAILS</button>")
					.data("containerName", containerName)
					.data("objectName", data[i].name)
					.click(function()   {getMetadataDetails($(this))}) 
					 );	
			row.append($('<td/>')
					.html("<button type='button' class='btn btn-warning'><span class='glyphicon glyphicon-eye-open'></span> PREVIEW</button>")
					.data("containerName", containerName)
					.data("objectName", data[i].name)
					.click(function() {previewObject($(this))})
					);
			table.append(row);
		}
	})
	clearSwiftTable();
    view="";
}
// to get the last object in the container
function getLastObject() { 
	$.ajax({
		url:"/swift/" +containerName+ "/last",
		headers:{"x-auth-token":$.cookie("BBOXSESSION")}
		}).done(function(data){
	//$.get("/swift/" +containerName+ "/last").success(function(data){
		// currentPageMarker = '';
	for (var i = 0 ; i < data.length ; i++) {
		// console.log(data[i].name);
		currentPageObjectMarker = data[i].name;
		}
	console.log("currentPageObjectMarker: " + currentPageObjectMarker);
})
   // console.log(currentPageMarker);
}
/*
 * *********************************************************************
 * ********************************************************************* object
 * table stuff
 * 
 */

function buildObjectTable(){ $(window).scrollTop(0);
	 document.getElementById("objSearch").value="";
	currentPageObjectMarker= "";
// getLastContainer();
	$("#objSearch").show()  
	$("#demo5").show()
	$("#demo6").show()
	$("#demo7").show()
	$("#backBtn").show()
	$("#createContainerDiv").hide()
	$("#createContainerForm").hide()
	$("#contSearch").hide();
	$("#searchForContainerbtn").hide()
	$("#uploadObjectDiv").show()
	$("#uploadObjectForm").show()
	$("#checkOldFilesBtn").show()
	$("#deleteOldFilesBtn").show()
	$("#ErrorAlert").hide()
	clearSwiftTable();
	document.getElementById("containerTxtUp").defaultValue = container;
	$("#SwiftTableHeading h3").html("List of objects in container '" + container + "'");
	
	
	buildObjectTableHeader();
    buildObjectTableContent();
	
}

function buildObjectTableHeader(){
	var table = $("#swiftList");
	// build header row
	var hr = $('<tr/>');
	hr.append($('<th/>').html("Name"));
	hr.append($('<th/>').html("Size"));
	hr.append($('<th/>').html("Type"));
	hr.append($('<th/>').html("Last Modification"));
	hr.append($('<th/>').html("Download"));
	hr.append($('<th/>').html("Delete"));
	hr.append($('<th/>').html("Details"));
	hr.append($('<th/>').html("Preview"));
	table.append(hr);
}


var contName;
var objName;



function buildObjectTableContent(){
	var table = $("#swiftList");
// getLastContainer();
	$.ajax({
		url:"/swift/containers/" + container + "/objects",
		headers:{"x-auth-token":$.cookie("BBOXSESSION")},
		data: {"marker": currentPageObjectMarker}
		}).done(function(data){
	//$.get("/swift/containers/" + container + "/objects", {marker: currentPageObjectMarker}).success(function(data){
			
		document.getElementById("demo").innerHTML = "All content Showed";
		for (var i = 0 ; i < data.length ; i++) {           
		   var row = $('<tr/>');
			// this information form objects body
			row.append($('<td/>').html(data[i].name));
			row.append($('<td/>').html(fileSizeSI(data[i].bytes)));
			row.append($('<td/>').html(data[i].content_type));
			row.append($('<td/>').html(data[i].last_modified)); // new object
																// body header

			row.append($('<td/>')
					.html("<button type='button' class='btn btn-success'><span class='glyphicon glyphicon-download'></span> GET</button>")
					.data("containerName", container)
					.data("objectName", data[i].name)
					.click(function() {getObject($(this))})
					);
			row.append($('<td/>')
				.html("<button type='button' class='btn btn-danger'><span class='glyphicon glyphicon-remove-sign'></span> DELETE</button>")
				.data("containerName", container)
				.data("objectName", data[i].name)
				.click(function() {deleteObject($(this))})
				);
	
			row.append($('<td/>')
					.html("<button type='button' class='btn btn-info' data-toggle='collapse' data-target='#demo11'><span class='glyphicon glyphicon-info-sign'></span> DETAILS</button>")
			
					.data("containerName", container)
					.data("objectName", data[i].name)
					.click(function()   {getMetadataDetails($(this))})
					);	
                    
			row.append($('<td/>')
					.html("<button type='button' class='btn btn-warning'><span class='glyphicon glyphicon-eye-open'></span> PREVIEW</button>")
					.data("containerName", container)
					.data("objectName", data[i].name)
					.click(function() {previewObject($(this))})
					);			
			table.append(row);
			currentPageObjectMarker = data[i].name;
			document.getElementById("demo").innerHTML = "Loading More";
		}
		
	})
	
}



var convData;
function getMetadataDetails(d){  
	$.ajax({
		url:"/swift/containers/" + containerName + "/objects/" + encodeURIComponent(objectName) + "/details",
		headers:{"x-auth-token":$.cookie("BBOXSESSION")}
		}).done(function(data){
	  var containerName = d.data("containerName");
	  var objectName = d.data("objectName");
	
	//$.get(url).success(function(data){
		var Datas = eval(data); // evaluation
		jsData={};
		// this information coming from Response objects headers
		jsData['ownerName'] = Datas['x-object-meta-ownername'];
		jsData['content-type'] = Datas['content-type'];
		jsData['Date'] = Datas['date'];

		convData = JSON.stringify(jsData);
		// for collapsed and expanded header meta data
	    document.getElementById("demo5").innerHTML= "ownerName " + " : "   + jsData['ownerName'];
	    document.getElementById("demo6").innerHTML= "content-type" + " : " + jsData['content-type'];
	    document.getElementById("demo7").innerHTML= "Date" + " : "         + jsData['Date'];

	    console.log(data);
	   
		return convData;

	});
	return convData;
}


function enterMetadataDetails(d){
	var containerName = d.data("containerName");
	buildObjectTable(containerName);
	
}
var containerName="";
var objectName ="";

function getObject(d){
	var containerName = d.data("containerName"); 
	  var objectName = d.data("objectName"); 
	  var url = "/swift/containers/" + containerName + "/objects/" + encodeURIComponent(objectName); 
	  window.location.replace(url);
}


function previewObject(d){
	var containerName = d.data("containerName");
	var objectName = d.data("objectName");
	var url = "/swift/containers/" + containerName + "/object/" + encodeURIComponent(objectName);
	myWindow = window.open(url,"", "width=200,height=100")
}

function deleteObject(d){
	var containerName = d.data("containerName");
	var objectName = d.data("objectName");
	var url = "/swift/containers/" + containerName + "/objects/" + encodeURIComponent(objectName);
	$.ajax({
	    url: url,
	    headers:{"x-auth-token":$.cookie("BBOXSESSION")},
	    type: 'DELETE',
	    success: function(data) {  
	   
	    	 if (data.deletestatus === "done") {
	    		 
	    		 alert("The Object is deleted");
	    		 buildObjectTable(containerName);
	    		} else {
	    			
	    	         			
	    			$("#ErrorAlert").show();
	    			$("#ErrorAlert").html('<strong>Error!</strong> The retention date is: '+ data.retention+"\n"+"\n The following time has been left for deletion: \n"+ " weeks: "+data.weeks+"\n days: "+data.days+"\n hours: "+data.hours+"\n minutes: "+data.minutes+"\n seconds: "+data.seconds);
	    		}

	  
	    }
	});
}

function deleteContainer(d){
	var containerName = d.data("containerName"); 
	var url = "/swift/containers/" + containerName;
	$.ajax({
	    url: url,
	    headers:{"x-auth-token":$.cookie("BBOXSESSION")},
	    type: 'DELETE',
	    success: function(data) {  
	    	 console.log(data.containerDeleteStatus);
	    	 if (data.containerDeleteStatus === "Failed") {
	    		 alert("You need to delete object(s) inside container first");
	   	 }  else  { 
	    		 alert("The Container is deleted");
	    	 buildContainerTable();
	    		
		    	 console.log(data.containerDeleteStatus);
	    		} 
	    	
	        
	    }
	});
}

/*
 * *********************************************************************
 * ********************************************************************* utility
 * functions
 * 
 */
 
/*
 * from:
 * http://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable
 * divides an integer by factors of 1000 (or 1024) to match the closest SI unit.
 * --> this function converts "bits/bytes" to kilo/mega/giga/...
 */
function fileSizeIEC(a,b,c,d,e){
 return (b=Math,c=b.log,d=1024,e=c(a)/c(d)|0,a/b.pow(d,e)).toFixed(2)
 +' '+(e?'KMGTPEZY'[--e]+'iB':'Bytes')
}
function fileSizeSI(a,b,c,d,e){
 return (b=Math,c=b.log,d=1e3,e=c(a)/c(d)|0,a/b.pow(d,e)).toFixed(2)
 +' '+(e?'kMGTPEZY'[--e]+'B':'Bytes')
}


/*
 * *********************************************************************
 * *********************************************************************
 * Checking Old files and deleting old files
 * 
 */
function CheckOldFiles()
{
		var url = "/swift/containers/" + containerName + "/CheckOldFiles/";
		$.ajax({
	    url: url,
	    headers:{"x-auth-token":$.cookie("BBOXSESSION")},
	    type: 'GET',
	    success: function(data) {
	    	filelist = data["list"]
	    	alert(JSON.stringify(filelist))
	    	}

		});
}

function DeleteOldFiles()
{
		var url = "/swift/containers/" + containerName + "/DeleteOldFiles/";
		$.ajax({
	    url: url,
	    headers:{"x-auth-token":$.cookie("BBOXSESSION")},
	    type: 'Delete',
	    success: function(data) {
	    	filelist = data["list"]
	    	alert(JSON.stringify(filelist))
	    	buildObjectTable(containerName);
	    		}

		});
}


/*
 * *********************************************************************
 * *********************************************************************
 * Creating folders and uploading files
 * 
 */
function createRequest(){
	$('#createContainerForm').submit(function(e){		   
	    $.ajax({
	        url:'/create',
	        headers:{"x-auth-token":$.cookie("BBOXSESSION")},
	        type:'post',
	        data:$('#createContainerForm').serialize(),
	        success:function(data){
	        	console.log(data.containerStatus);
		    	 if (data.containerStatus === "Failed") {
		    		 alert("The Name already exists");
		   	 }  else {
	            alert("success");

	            
		   	      }
	        }
	    });
	    buildContainerTable()
	    e.preventDefault();
		document.getElementById("containerTxt").value ="";
	
	});

}

function uploadRequest(){
	$('#uploadObjectForm').submit(function(e){
		   
	    $.ajax({
	        url:'/upload',
	        headers:{"x-auth-token":$.cookie("BBOXSESSION")},
	        type:'post',
	        data:new FormData($(this)[0]),
	        processData:false,
	        contentType:false,
	        success:function(){
	            alert("success");
	            buildObjectTable(containerName);
	        }
	    });
	    e.preventDefault();
	    document.getElementById("ownerTxt").value ="";
	    document.getElementById("ownerTxt1").value ="";
	    document.getElementById("retentionDate").value ="";
	    
	});		
}


function hideAllPopovers(){
    $('.pop-show').each(function() {
         $(this).popover('hide');
     });  
 };




