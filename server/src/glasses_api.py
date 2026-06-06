from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Load model and cascade (ensure these files are in the same directory)
model = load_model('my_model.keras')
face_cascade = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')
size = 100
labels = ['no_glasses', 'glasses']

def preprocess(face_img):
    img = cv2.resize(face_img, (size, size))
    img = img_to_array(img)
    img = np.expand_dims(img, axis=0)
    return img

@app.post('/predict')
async def predict(file: UploadFile = File(...)):
    img_bytes = await file.read()
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    if len(faces) == 0:
        return JSONResponse(content={'error': 'no_face'})
    x, y, w, h = faces[0]
    face = img[y:y+h, x:x+w]
    data = preprocess(face)
    result = model.predict(data)
    pred = int(np.argmax(result))
    return JSONResponse(content={'label': labels[pred]})
