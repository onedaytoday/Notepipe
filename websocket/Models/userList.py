import logging
import jsonpickle
import uuid
import time
import websockets

from dataclasses import dataclass
from Models.responses import fullUserList, updateUserName, removeUserFromList, newUserJoined
from Models.responses import updateUserPermissions

log = logging.getLogger(__name__)

@dataclass
class userObject:
    id: str
    name: str
    canBroadcast: bool
    isTeacher: bool

@dataclass
class userList:
    studentKey: str
    users: dict[str, userObject]

    def addUser(self, id: str, user: userObject, connected):
        """Add or update a user with a userObject"""

        log.info("Updating user %s for %s with userObject %s", id,  self.studentKey, user)
        try:
            self.users.update({id: user})
        except Exception as e:
            log.warn("Failed to update id %s, %s", id, e)
        broadcast= newUserJoined()
        broadcast.id= str(id)
        broadcast.name= user.name
        broadcast.user = user;
        websockets.broadcast(connected, jsonpickle.encode(broadcast, unpicklable=False))        


    async def fullUserList(self, websocket): 
        self.sortDictionary()
        broadcast = fullUserList()
        broadcast.names = jsonpickle.encode(self.users, unpicklable=False)
        await websocket.send(broadcast.toJson()) 

    def sortDictionary(self):
        try:
            self.users= dict(sorted(self.users.items(), key=lambda item: item[1].name))
            # for i in self.users:
            #     log.info(self.users[i].name)
        except Exception as e:
            log.warn("Failed to sort dictionary")

    def removeUser(self, id: str, connected):
        """Remove a user with a id"""

        log.info("Removing user %s from %s", id, self.studentKey)
        try:
            broadcast=removeUserFromList()
            broadcast.id= str(id)
            broadcast.canBroadcast= self.users[id].canBroadcast
            websockets.broadcast(connected, broadcast.toJson())

            del self.users[id]
        except Exception as e:
            log.warn("Failed to delete object %s, %s", id, e)



    def updateUserName(self, id:str, name: str, connected):
        """Update the name of a user by id"""

        log.info("Updating id %s with name %s", id, name)
        try:
            self.users[id].name = name
        except Exception as e:
            log.warn("Failed to update name of id %s, %s", id, e)
        broadcast= updateUserName()
        broadcast.id= str(id)
        broadcast.name= name
        broadcast.canBroadcast= self.users[id].canBroadcast
        websockets.broadcast(connected, broadcast.toJson())


    def updateUserPermissions(self, id:str, canBroadcast: bool, connected):
        """Update the write permission of a user by id"""

        log.info("Updating id %s with permission %s", id, canBroadcast)
        try:
            #if self.users[uuid.UUID(id)].isTeacher:
                #raise "Can't change Teacher permission"
            self.users[uuid.UUID(id)].canBroadcast = canBroadcast
        except Exception as e:
            log.warn("Failed to update permission of id %s, %s", id, e)
        broadcast= updateUserPermissions()
        broadcast.id= id
        broadcast.canBroadcast = canBroadcast
        websockets.broadcast(connected, broadcast.toJson())


    def toJson(self) -> str:
        return jsonpickle.encode(self, unpicklable=False)


if __name__ == "__main__":
    """Json pickling test"""
    myList = userList("123", {})
    obj = userObject("0", "myName", False, True)
    myList.addUser("0", obj)
    for i in range(1000):
        myList.addUser(str(i), obj)
    start = time.time()
    print(myList.toJson())
    elapse = time.time() - start
    print(elapse)

