"""
	Project Bluebox
	2015, University of Stuttgart, IPVS/AS
"""
from itertools import count
""" 
	Project Bluebox 
	
	Copyright (C) <2015> <University of Stuttgart>
	
	This software may be modified and distributed under the terms
	of the MIT license.  See the LICENSE file for details.
"""

import base64
import requests
from swiftclient import client
import logging
import json


'''initialize logging
'''
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(module)s - %(levelname)s ##\t  %(message)s')
log = logging.getLogger()


'''Function to connect to swift object store
'''
class SwiftConnect:
		def __init__(self, swift_type, swift_url):
			self.swift_url = swift_url
			self.swift_user_url = ""
			self.swift_user_token = ""
			'''if "BluemixV1Auth" == swift_type:
				self.doBluemixV1Auth()
			else:
				self.doRegularSwiftAuth()
'''
			
		def doRegularSwiftAuth(self,user,password):
			log.debug("Connecting to regular swift at: {}".format(self.swift_url))
			self.conn = client.Connection(authurl=self.swift_url, user=user, key=password)
			self.swift_user_token=self.conn.get_auth()[1]
			print("hallo")
			print(json.dumps(self.swift_user_token))
			return self.swift_user_token
			
		def doBluemixV1Auth(self):
			log.debug("Connecting to Bluemix V1 swift at: {}".format(self.swift_url))
			authEncoded = base64.b64encode(bytes('{}:{}'.format(self.swift_user, self.swift_pw),"utf-8"))
			authEncoded = "Basic "+ authEncoded.decode("utf-8")
			response =  requests.get(self.swift_url, 
			headers  =  {"Authorization": authEncoded})
			log.debug(response.headers['x-auth-token'])
			log.debug(response.headers['x-storage-url'])			
			self.conn = client.Connection(
				preauthtoken=response.headers['x-auth-token'],
				preauthurl=response.headers['x-storage-url']
				
		)

#####################################################################################################################################################################################
		'''Creating a Container
		'''
		def createContainer(self,folderName):
			log.debug("Inside create container")
			self.container_name = folderName
			self.conn.put_container(self.container_name)
			return True
			
						
			
#####################################################################################################################################################################################
		'''Creating an Object
		'''
		def createObject(self,fileName,fileContent,folderName,metadataDict,cs):
			log.debug(fileName)
			log.debug("Inside create Object")
			self.conn.put_object(container=folderName, obj= fileName, contents= fileContent,headers=metadataDict,chunk_size=cs)
			
#####################################################################################################################################################################################                                        
		'''Retrieving an object 
		'''
		def retrieveObject(self,folderName,fileName):
			log.debug("Inside retrieve object")
			obj_tuple = self.conn.get_object(folderName,fileName)
			return obj_tuple[0]
		
		
#####################################################################################################################################################################################        
		'''Retrieving an object
		'''
		def getObject(self,containernames,filename,resp_chunk_size):
			log.debug("Inside get object")
			log.debug(containernames)
			log.debug(filename)
			obj_tuple = self.conn.get_object(containernames,filename,resp_chunk_size)
			log.debug("Metadata")
			log.debug(obj_tuple[0])
			return obj_tuple[1]
	################################################################################################ 
		'''delete Container
		'''
		def delContainer(self,containernames):
			log.debug("Inside delete Container")
			log.debug(containernames)
			self.conn.delete_container(containernames)	
	#############################################################       

#deleting an object 
		def delObject(self,containernames,filename):
			log.debug("Inside del object")
			log.debug(containernames)
			log.debug(filename)
			self.conn.delete_object(containernames, filename)

################################################################################################       

		'''deleting objects 
		'''
		def delObjects(self,containernames,filenames):
			log.debug("Inside del object")
			log.debug(containernames)
			for filename in filenames:        # Second Example
				print ('Current file :', filename)
				log.debug(filename)
				self.conn.delete_object(containernames, filename)

####################################################################################################################################################
		'''Creating an container list
		'''
		def containerList(self, limit=8, marker1=""):
			log.debug("container List")
			containers = self.conn.get_account(marker=marker1, limit=limit)[1]
			for container  in containers:
				log.debug(container ['name'])
			return containers

#####################################################################################################################################################################################                                        
		'''Create filtered container List
		'''
		def FilteredcontainerList(self,m2=""):
			
			containers2 = self.conn.get_account(prefix=m2)[1]
			for container2  in containers2:
				log.debug(container2 ['name'])
			return containers2    
#####################################################################################################################################################################################                                        
		'''Create filtered Object List
		'''				
		def FilteredObjectList(self,containerName,m4=""):
			
			objects2 = self.conn.get_container(containerName ,prefix=m4)[1]
			
			return objects2
#####################################################################################################################################################################################                                        
		'''get the name of last container
		'''		
		def lastContainer(self, m3=""):
			log.debug("container List")
			containers3 = self.conn.get_account(marker=m3)[1]
				
			return containers3 
#####################################################################################################################################################################################                                        
		'''get the name of last Object
		'''		
		def lastObject(self,containerName, m5=""):
			containers3 = self.conn.get_container(containerName,marker=m5)[1]
			return containers3 
			
####################################################################################################################################################
		'''return limited list of objects belong to specific container
		'''
		def fileList(self,containername , limit=6, marker=""):
			
			log.debug("Files in a container")
			files = self.conn.get_container(containername,full_listing=False ,limit=limit,marker=marker)[1]
			return files
#####################################################################################################################################################################################        

		'''Create list of objects belong to the specific container 
		'''
		def ObjectList(self,containername):
			
			log.debug("Files in a container")
			objects = self.conn.get_container(containername)[1]
			
			return objects  

########################################### #####################################################    
		'''Retrieving an object Meta-data 
		'''
		def getObjMetaData(self,containernames,filename):
			log.debug("Inside get object")
			log.debug(containernames)
			log.debug(filename)
			obj_tuple = self.conn.head_object(containernames,filename)
			log.debug(obj_tuple)  # index [0] returns the Headers of the Object file
			
			return obj_tuple
########################################### #####################################################    
		'''Retrieving an Container Metadata
		'''
		def getContainerMetaData(self,containername):
			log.debug("Inside get Containers")
			log.debug(containername)
			containers_tuple = self.conn.head_container(containername)
			return containers_tuple['x-timestamp']
########################################### #####################################################    
		'''Closing the connection 
		'''
		def closeConnection(self):
			self.conn.close()
		
