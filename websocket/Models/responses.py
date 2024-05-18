import json

# Templates for sending information to clients


class response:
    def toJson(self) -> str:
        return json.dumps(self.__dict__)


class initializeHostSuccess(response):
    def __init__(self, hostKey=None, studentKey=None, websocketID=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "Successfully initialized host"
        self.hostKey = hostKey
        self.studentKey = studentKey
        self.websocketID = websocketID


class initializeStudentSuccess(response):
    def __init__(self, studentKey=None,  pageNumber=None, imageURL=None, id=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "Successfully initialized student"
        self.studentKey = studentKey
        self.pageNumber = pageNumber
        self.imageURL= imageURL
        self.id = id


class canvasUpdateSuccess(response):
    def __init__(self, pageNumber=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.pageNumber = pageNumber
        self.message = "Successfully processed canvas update"


class canvasBroadcast(response):
    def __init__(self, imageURL=None, pageNumber=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.imageURL = imageURL
        self.pageNumber = pageNumber

class canvasDrawUpdateBroadcast(response):
    def __init__(self, drawData=None, eraser=None, page=None, srcID=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.drawData = drawData
        self.page = page
        self.eraser = eraser
        self.srcID = srcID

class clearpage(response):
    def __init__(self) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "New page started"

class resetbutton(response):
    def __init__(self) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "clear the  page "
        
class error(response):
    def __init__(self) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "Unknown Error"

class imageToTextRequest(response):
    def __init__(self, studentKey=None, imageURL=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "Image to text function requested"
        self.studentKey = studentKey
        self.imageURL= imageURL
        self.convertedText = ""
        
class textToSpeechRequest(response):
    def __init__(self, studentKey=None, inputText=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "Text to speech function requested"
        self.studentKey = studentKey
        self.inputText = inputText
        self.convertedAudio = ""

class pageFetched(response):
    def __init__(self, studentKey=None, pageNumber= None, imageURL=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "Page has been fetched"
        self.studentKey = studentKey
        self.pageNumber = pageNumber
        self.imageURL= imageURL

class userJoinUpdate(response):
    def __init__(self, userList):
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "Userlist change"
        self.userList = userList

class imageFetched(response):
    def __init__(self, studentKey=None, pageNumber= None, imageURL=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "Image has been fetched"
        self.studentKey = studentKey
        self.pageNumber = pageNumber
        self.imageURL= imageURL

class newPageCreated(response):
    def __init__(self):
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "New Page Added"

class fullUserList(response):
    def __init__(self, name=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.names = name
        self.message = "Retrieving full user list"

class newUserJoined(response):
    def __init__(self, name=None, id=None, user=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.id = id
        self.name = name
        self.message = "New user has joined"
        self.user = user

class updateUserName(response):
    def __init__(self, name=None, id=None, canBroadcast=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.id = id
        self.name = name
        self.canBroadcast= canBroadcast
        self.message = "user updated name"

class removeUserFromList(response):
    def __init__(self, id=None, canBroadcast=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.id = id
        self.canBroadcast= canBroadcast
        self.message = "User has left"

class NewpagesInserted(response):
    def __init__(self, insertIndex=None,imageURL=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.insertIndex = insertIndex
        self.message = "New page Inserted"


class endHighlightStroke(response):
    def __init__(self, srcID=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.srcID = srcID

class followHost(response):
    def __init__(self, pageNumber=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.pageNumber = pageNumber

class updateUserPermissions(response):
    def __init__(self, id=None, canBroadcast=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.id = id
        self.canBroadcast= canBroadcast
        self.message = "User permissions changed"