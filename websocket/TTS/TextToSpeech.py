from google.cloud import texttospeech
import os
import redis
import base64
import inspect # Used for inspect.stack()[0][3] within functions, which returns the function name it's called in

ROOT_DIR = os.path.realpath(os.path.join(os.path.dirname(__file__), '..'))
FILE_PATH = os.path.join(ROOT_DIR, 'OCR', 'credentials.json')
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = FILE_PATH

""" Retrieve text generated from ocr script (probably from redis database) """

# Take in some text and turn it into audio using customizable speech synthesis
def createAudio(text):
    try:
        client = texttospeech.TextToSpeechClient()
    except Exception:
        print("Invalid Google Cloud API credentials. Exiting createAudio()")
        return
    syn_input = texttospeech.SynthesisInput(ssml=text)

    # Customization for how the voice sounds and how it gets encoded
    voice = texttospeech.VoiceSelectionParams(language_code = "en-US", name = "en-US-Wavenet-G")
    audio_config = texttospeech.AudioConfig(audio_encoding = texttospeech.AudioEncoding.MP3)

    # Create the audio and output it (as an mp3 file here)
    response = client.synthesize_speech(input = syn_input, voice = voice, audio_config = audio_config)
    return base64.b64encode(response.audio_content).decode('ascii')

# Test the createAudio function
def testAudio():
    text = "<speak> This is a test. Text should be converted to audio. </speak>" # Uses ssml tags
    createAudio(text)

# redis test
def storeData():
    function_name = inspect.stack()[0][3]
    if (testConnection(function_name)):
        database = redis.StrictRedis(host = "localhost", port = 8002, decode_responses = True)
        database.set("redis_test", "this should be outputted")

# redis test
def getData():
    function_name = inspect.stack()[0][3]
    if (testConnection(function_name)):
        database = redis.StrictRedis(host = "localhost", port = 8002, decode_responses = True)
        text = database.get("redis_test")
        print(text)

# Tests connection to Redis database
# Returns: False if connection failed, True if connection was successful
def testConnection(function_name):
    try:
        connection_test = redis.Redis("localhost", port = 8002, socket_connect_timeout = 1)
        connection_test.ping()
    except (TimeoutError, redis.exceptions.TimeoutError):
        print("Could not establish connection to Redis database for function " + function_name + "().")
        return False
    return True

""" Store generated audio into redis database """
# Uncomment function calls below to test redis and Google Cloud TTS
#storeData()
#getData()

#testAudio()