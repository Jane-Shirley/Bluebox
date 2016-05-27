"""
	Project Bluebox
	2015, University of Stuttgart, IPVS/AS
"""
from _collections_abc import Iterator
from itertools import count
import abc
from distutils.log import debug
""" 
	Project Bluebox 
	
	Copyright (C) <2015> <University of Stuttgart>
	
	This software may be modified and distributed under the terms
	of the MIT license.  See the LICENSE file for details.
"""

from flask import Flask, render_template, request, Response
from werkzeug import secure_filename
from SwiftConnect import SwiftConnect
import json, logging, os, time, datetime
import appConfig
from email._header_value_parser import ContentDisposition, Header
from http import cookies



'''initialize logging
'''
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(module)s - %(levelname)s ##\t  %(message)s')
log = logging.getLogger()

'''Initialize the Flask application
'''
app = Flask(__name__)

'''Instantiating SwiftClient
'''
swift = SwiftConnect(appConfig.swift_type, appConfig.swift_url)
cookie = cookies.SimpleCookie()
##########################################################################################
"""
	This route will show a form to perform an AJAX request
	jQuery is loaded to execute the request and update the
	value of the operation
"""


@app.route('/', methods=['GET'])
def index():
	print(request.args.get("user"))
	if(cookie.get(request.args.get("user"))==None):
		
		return render_template('login.html')
	return render_template("index.html")

##########################################################################################
"""
	get the list of containers , we get  value of marker from the front end (java script)
"""
@app.route('/swift/containers', methods=['GET'])
def getContainers():

	user=request.headers['x-auth-token']
	check_user(user)
	log.debug("inside container list")
	m =request.args.get('marker','')
	ctss= swift.containerList(marker1=m)
	ctss5= getTimeStamp(ctss)
	return ctss5 

##########################################################################################
"""
	get the Retention Time(Time stamp) for each container
"""
def getTimeStamp(ctss):
	ctss4 = dict()
	ctss14 = dict()
	a = []
	log.debug("inside container ctss")
	for cont in ctss:
		'''(find time stamp for each container from container header)
		'''
		ctss4['Time1'] = swift.getContainerMetaData(cont['name'])
		x = float(ctss4['Time1'])
		y = int(x)
		'''convert time stamp to readable form , from 'http://stackoverflow.com/questions/3682748/converting-unix-timestamp-string-to-readable-date-in-python'
		'''
		retenT = (datetime.datetime.fromtimestamp(y ).strftime('%Y-%m-%d %H:%M:%S'))  
		ctss14['Time'] = retenT
		d4 = dict(cont)
		d4.update(ctss14)
		a.append(dict(d4))

	j = json.dumps(a,sort_keys=True)
# 
	return Response(j, mimetype='application/json')
##########################################################################################
"""""
    get filtered list of containers
"""""
@app.route('/swift/containers/filtered', methods=['GET'])
def getContainersFiltered():
	user=request.headers['x-auth-token']
	check_user(user)
	print("inside container list")
	log.debug("inside container list")
	m2 =request.args.get('marker2','')
	ctsss= swift.FilteredcontainerList(m2)
	ctss5= getTimeStamp(ctsss)
	return ctss5

##########################################################################################
"""""
    get filtered list of objects
"""""

@app.route('/swift/<containerName>/filtered', methods=['GET'])
def getObjectsFiltered(containerName):
	user=request.headers['x-auth-token']
	check_user(user)
	print("inside container list")
	log.debug("inside container list")
	m4 =request.args.get('marker4','')
	log.debug(m4)
	ctsss= swift.FilteredObjectList(containerName,m4)

	log.debug(ctsss)

	jj = json.dumps(ctsss,sort_keys=True)
	return Response(jj, mimetype='application/json')
##########################################################################################
"""""
    get Last container
"""""	
@app.route('/swift/containers/last', methods=['GET'])
def getLastContainer():
	user=request.headers['x-auth-token']
	check_user(user)
	print("inside container list")
	log.debug("inside container list")
	
	ctss= swift.lastContainer("")
	
	j = json.dumps(ctss,sort_keys=True)
	return Response(j, mimetype='application/json')
##########################################################################################
"""""
    get Last Object
"""""		
@app.route('/swift/<containerName>/last', methods=['GET'])
def getLastObject(containerName):
	user=request.headers['x-auth-token']
	check_user(user)
	print("inside container list")
	log.debug("inside container list")	
	ctss= swift.lastObject(containerName,"")
	j = json.dumps(ctss,sort_keys=True)
	return Response(j, mimetype='application/json')

##########################################################################################
"""
 create the Container
"""
@app.route('/create', methods=['POST'])
def create():
	user=request.headers['x-auth-token']
	check_user(user)
	folderName = request.form['containerName']
	

	print(folderName)
	responsemsg={}
	
	container= swift.FilteredcontainerList(folderName)
	if (container != []):
		responsemsg['containerStatus'] = "Failed"  
		return Response(json.dumps(responsemsg),mimetype='application/json')
	
	else:
		swift.createContainer(folderName)
		return Response(None)


##########################################################################################
"""
	get the list of all objects in a container
"""
@app.route('/swift/containers/<containerName>/objects', methods=['GET'])
def getObjectsInContainer(containerName):
	user=request.headers['x-auth-token']
	check_user(user)
	
	n =request.args.get('marker','')
	
	log.debug(containerName)
	cts = swift.fileList(containerName,marker=n)
	debug(cts)
	f = json.dumps(cts,sort_keys=True)
	return Response(f, mimetype='application/json')



	
##########################################################################################
"""
	get the list of meta-data information of all objects in a container
"""
@app.route('/swift/containers/<containerName>/objects/<path:filename>/details', methods=['GET'])
def getMetaDataInfo(containerName,filename):
	user=request.headers['x-auth-token']
	check_user(user)
	log.debug("Get meta-data information")
	log.debug(containerName)
	log.debug(filename)

	metaInfo = swift.getObjMetaData(containerName,filename)
	metadata = json.dumps(metaInfo,sort_keys=True)
	
	return Response(metadata, mimetype='application/json')


##########################################################################################

"""
	Route that will process the file upload
"""
@app.route('/upload', methods=['POST'])
def upload():
	user=request.headers['x-auth-token']
	check_user(user)
	'''
	Get the name of the uploaded file
	'''
	chunk = 8000
	log.debug("inside the upload part")
	inputFile = request.files['objectName']
	'''Check if the file is one of the allowed types/extensions
	'''
	if inputFile:
		log.debug("accepted file upload")
		'''Make the filename safe, remove unsupported chars
		'''
		inputFileName = secure_filename(inputFile.filename)
		log.debug(inputFileName)
		
#
	folderName = request.form['containerNameUp']
	log.debug(folderName)
	retentime =  request.form['RetentionPeriod']
	log.debug(retentime)
	if retentime:
		convertretentime = datetime.datetime.strptime(retentime,"%Y-%m-%d").strftime("%d-%m-%Y")
		log.debug(convertretentime)
		retentimestamp = int(time.mktime(datetime.datetime.strptime(convertretentime, "%d-%m-%Y").timetuple()))
		log.debug(retentimestamp)
	else:
		retentimestamp = retentime
	h = dict()
	h["X-Object-Meta-RetentionTime"] = retentimestamp
	h["X-Object-Meta-OwnerName"] = request.form['OwnerName']

	swift.createObject(inputFileName,inputFile,folderName,h,chunk)
	return Response(None)
		
##########################################################################################
"""
	download obj route
	
"""
@app.route('/swift/containers/<containerName>/objects/<path:filename>', methods=['GET'])
def downloadObject(containerName, filename, resp_chunk_size= 10):
	user=request.args.get("user")
	check_user(user)
	log.debug("downloadObject: %s - %s" % (containerName, filename))
	encodedOutputFile = swift.getObject(containerName,filename,resp_chunk_size= 10)
	return Response(encodedOutputFile, mimetype='application/octet-stream')

##########################################################################################
"""
	Preview object
"""
@app.route('/swift/containers/<containerName>/object/<path:filename>', methods=['GET'])
def previewObject(containerName, filename):
	user=request.args.get("user")
	check_user(user)
	log.debug("previewObject: %s - %s" % (containerName, filename))
	metaData = swift.retrieveObject(containerName,filename)
	encodedOutputFile = swift.getObject(containerName,filename,resp_chunk_size=1000)
	ContentDisposition('inline')
	response = Response(encodedOutputFile,mimetype=metaData['content-type']);
	response.headers['content-disposition']="inline";
	return response;
##########################################################################################
def calcTimeDifference(timestamp):
	
	user=request.headers['x-auth-token']
	check_user(user)
	try:
		return int(timestamp) - int(time.time())
	except ValueError:
		return False

def isRetentionPeriodExpired(timestamp):
	
	user=request.headers['x-auth-token']
	check_user(user)
	if (calcTimeDifference(timestamp)):
		return calcTimeDifference(timestamp) <= 0
	return False
##########################################################################################
"""
	delete container route
"""
@app.route('/swift/containers/<containerName>', methods=['DELETE'])
def deleteContainer(containerName):
	
	user=request.headers['x-auth-token']
	check_user(user)
	responsemsg={}
	ctss = swift.ObjectList(containerName)
	log.debug(ctss)
	if (ctss != []):
		responsemsg['containerDeleteStatus'] = "Failed"
		return Response(json.dumps(responsemsg),mimetype='application/json')
	
	else:
		swift.delContainer(containerName)
		responsemsg['containerDeleteStatus'] = "done"
		return Response(json.dumps(responsemsg),mimetype='application/json')
	

##########################################################################################
"""
	delete obj route
"""
@app.route('/swift/containers/<containerName>/objects/<path:filename>', methods=['DELETE'])
def deleteObject(containerName,filename):
		user=request.headers['x-auth-token']
		check_user(user)
		log.debug("deleteObject: %s - %s" % (containerName, filename))
		json1 = json.dumps(swift.getObjMetaData(containerName,filename),ensure_ascii=False)
		log.debug(json1)
		
		new_dict = json.loads(json1)
		retentimestamp = new_dict['x-object-meta-retentiontime']
		if (isRetentionPeriodExpired(retentimestamp) or not retentimestamp):
			swift.delObject(containerName,filename)
			responsemsg={}
			responsemsg['deletestatus'] = "done"
			return Response(json.dumps(responsemsg),mimetype='application/json')
		else:
			log.debug("You are not allowed to delete the file!")
			log.debug( "The retentiondate is: " +
				    datetime.datetime.fromtimestamp(
				        int(retentimestamp)
				    ).strftime('%m-%d-%Y')
				)
			minutes, seconds = divmod(calcTimeDifference(retentimestamp), 60)
			hours, minutes = divmod(minutes, 60)
			days, hours = divmod(hours, 24)
			weeks, days = divmod(days, 7)
			log.debug("The number of days left for deletion: " + str(days))	
			log.debug("You should wait for "+ str(weeks)+" weeks and "+ str(days)+" days and "+str(hours)+" hours and "+str(minutes)+" minutes and"+str(seconds)+" seconds to delete this file!!!")
			responsemsg={}
			responsemsg['deletestatus'] = "failed"
			responsemsg['retention'] = datetime.datetime.fromtimestamp(int(retentimestamp)).strftime('%m-%d-%Y')
			responsemsg['seconds'] = seconds
			responsemsg['minutes'] = minutes
			responsemsg['hours'] = hours
			responsemsg['days'] = days
			responsemsg['weeks'] = weeks
			return Response(json.dumps(responsemsg),mimetype='application/json')
			
#################################Scheduler#########################################################
@app.route('/swift/containers/<containerName>/CheckOldFiles/', methods=['GET'])
def CheckOldFiles(containerName, doDelete=False):
	
	user=request.headers['x-auth-token']
	check_user(user)
	log.debug(containerName)
	files = swift.fileList(containerName)
	filenames = list()
	for file in files:
		log.debug('{0}\t{1}\t{2}'.format(file['name'], file['bytes'], file['last_modified']))
		fileMetaDict = swift.getObjMetaData(containerName,file['name'])
		log.debug(fileMetaDict)
		log.debug(file['name'])
		log.debug(fileMetaDict['x-object-meta-retentiontime'])
		retentimestamp = fileMetaDict['x-object-meta-retentiontime']
		
		if (isRetentionPeriodExpired(retentimestamp)):
			filenames.append(file['name'])

				
	log.debug(filenames)	
	responseObj = {"list" : filenames}
	if (doDelete):
		swift.delObject(containerName,filenames)
	return Response(json.dumps(responseObj),mimetype='application/json') 


###################################################################################################
@app.route('/swift/containers/<containerName>/DeleteOldFiles/', methods=['Delete'])
def DeleteOldFiles(containerName):
	
	user=request.headers['x-auth-token']
	check_user(user)
	return CheckOldFiles(containerName, doDelete=True)


def check_user(token):
	if(cookie.get(token)==None):
		
		return render_template('login.html')
	
	
@app.route("/users/login",methods=['GET'])
def authenticate():
	print(request.args.get('password'))
	swift_user_token = swift.doRegularSwiftAuth(request.args.get('user'), request.args.get('password'))
	print(swift.doRegularSwiftAuth(request.args.get('user'), request.args.get('password')))

	cookie[swift_user_token] = swift_user_token
	jsonResponse ={}
	jsonResponse['status']='OK'
	jsonResponse['user']=swift_user_token
	return Response(json.dumps(jsonResponse))

###################################################################################################
"""Main Function
"""    
if __name__ == '__main__':
	appPort = os.getenv('VCAP_APP_PORT', '5000')
	appHost = os.getenv('VCAP_APP_HOST', '127.0.0.1')
	app.run(
		host=appHost,
		port=int(appPort),
		debug=True
			
	)

