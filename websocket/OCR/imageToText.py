import os, io
from google.cloud import vision_v1
from binascii import a2b_base64

ROOT_DIR = os.path.realpath(os.path.join(os.path.dirname(__file__), '..'))
FILE_PATH = os.path.join(ROOT_DIR, 'OCR', 'credentials.json')
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = FILE_PATH

# Instantiate the OCR client
client = vision_v1.ImageAnnotatorClient()

def readImage(uri):
    """ Triggers an api call through the OCR client;
        Recieves, formats, and displays response
    Args:
        uri (file): The image to be scanned (base64 encoded)
    """

    # separate encoded data of the uri from header info
    header, encoded = uri.split(",", 1)
    content = a2b_base64(encoded)

    # make the api call and recieve response
    image = vision_v1.Image(content=content)
    return client.text_detection(image=image)


def reorderWords(response):
    text_list = []

    # scan response & pair each text with it's location info
    for text in response.text_annotations[1:]:
        startX = text.bounding_poly.vertices[0].x
        startY = text.bounding_poly.vertices[0].y

        start_vertex = (startX, startY) # left-bottom vertex of text boundary
        text_list.append([text.description, start_vertex])

    return text_list


def rearrangeLines(unformatted_text):
    """ Format the raw OCR output
    Args:
        unformatted_text (list): a jumbled list of texts recognized by the OCR
    Returns:
        hori_sorted (list); an ordered list of lines of texts
    """
    final_text = ""

    # sort list based on vertical location of each text
    vert_sorted = sorted(unformatted_text, key = lambda x:x[1][1])
    lines_grouped = breakLines(vert_sorted) # group texts on the same line
    hori_sorted = []

    # sort each line based on horizontal location of each text
    for line in lines_grouped:
        hori_sorted.append(sorted(line, key = lambda x:x[1][0]))

    # convert to string 
    for line in hori_sorted:
        for text in line:
            final_text += text[0]
            final_text += " "
        final_text += "\n"
    return final_text


def breakLines(unwrapped_text):
    """ Wrap long string of text
    Args:
        unwrapped_text (list): unwrapped string of list of text
    Returns:
        wrapped_text (list); wrapped block of list of text
    """
    if unwrapped_text is None:
        return
    LINE_TOLERANCE = 20
    wrapped_text = [[unwrapped_text[0]]]
    prev_text_pos_y = unwrapped_text[0][1][1]
    curr_line = 0

    for text in unwrapped_text[1:]:
        # measure the diff in pos of current & previous text
        if abs(text[1][1]-prev_text_pos_y) <= LINE_TOLERANCE:
            # if diff is below tolerance level, add 'text' to curr_line
            wrapped_text[curr_line].append(text)
        else: 
            curr_line += 1
            wrapped_text.append([]) # create a new line
            wrapped_text[curr_line].append(text) # add 'text' to new line
        prev_text_pos_y = text[1][1]

    return wrapped_text