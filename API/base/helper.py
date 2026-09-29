from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from roboflow import Roboflow
import cv2

def roboflowHelperFunc(instance):
    if not settings.ROBOFLOW_API_KEY:
        raise ImproperlyConfigured("Set ROBOFLOW_API_KEY in API/.env (see API/.env.example).")
    rf = Roboflow(api_key=settings.ROBOFLOW_API_KEY)
    project = rf.workspace().project("word_detection-mtq4b")
    model = project.version(1).model

    import supervision as sv

    base_path = instance.file.path

    image_path = base_path

    result = model.predict(image_path, confidence=40, overlap=30).json()

    labels = [item["class"] for item in result["predictions"]]

    detections = sv.Detections.from_roboflow(result)

    label_annotator = sv.LabelAnnotator()
    bounding_box_annotator = sv.BoxAnnotator()

    image = cv2.imread(image_path)

    annotated_image = bounding_box_annotator.annotate(
        scene=image, detections=detections)
    annotated_image = label_annotator.annotate(
        scene=annotated_image, detections=detections, labels=labels)
    
    print("Type of 'detections':", type(detections))

    xyxy_array = detections.xyxy  # Access the 'xyxy' attribute

    # Initialize empty lists to store x and y values
    x_values = []
    y_values = []

    # Loop through each inner array and extract the first two elements
    for inner_array in xyxy_array:
        x, y = inner_array[:2]
        x_values.append(x)
        y_values.append(y)

    word_images = []
    box_dimensions = []
    for i, prediction in enumerate(result["predictions"]):
        x, y = int(x_values[i]), int(y_values[i])
        width, height = (
                int(prediction["width"]),
                int(prediction["height"]),
            )
        box_dimensions.append({"index": i + 1, "x":x, "y":y  , "width": width, "height": height})
        word_image = cv2.imread(image_path)[y : y + height, x : x + width]
        word_images.append(word_image)

    # Save or use the array of word images as needed
    for i, word_image in enumerate(word_images):
        cv2.imwrite(f"C:/Users/Nandini/Documents/GitHub/HMAC/API/OCR/testing/words_{i+1}.jpg", word_image)

    box_dimensions = sorted(box_dimensions, key=lambda box: (box["y"]))

    line_count = 1
    lines = []
    current_line = [box_dimensions[0]]
    threshold = 20

    # Count lines and words based on y-value and threshold
    for i in range(1, len(box_dimensions)):
        #compare current y and previous y value to see if they are on the same line
        if box_dimensions[i]["y"] - current_line[-1]["y"] < threshold:
            # if yes then add this word to the current line and continue
            current_line.append(box_dimensions[i])
        else:
            # else sort the current line by x-value and add it to the lines list
            current_line = sorted(current_line, key=lambda box: (box["x"]))
            lines.extend(current_line)
            line_count += 1
            # reset the current line to the current word
            current_line = [box_dimensions[i]]


    line_count += 1
    current_line = sorted(current_line, key=lambda box: (box["x"]))
    lines.extend(current_line)

    return lines

def hconcat_resize_batch(img_list, batch_size, interpolation=cv2.INTER_CUBIC):
    result_images = []

    for i in range(0, len(img_list), batch_size):

        batch = img_list[i:i + batch_size]

        h_min = min(img.shape[0] for img in batch)

        im_list_resize = [cv2.resize(img, (int(img.shape[1] * h_min / img.shape[0]), h_min), interpolation=interpolation) for img in batch]

        im_list_padded = [cv2.copyMakeBorder(img, top=0, bottom=0, left=0, right=10, borderType=cv2.BORDER_CONSTANT, value=(255, 255, 255)) for img in im_list_resize]

        result_image = cv2.hconcat(im_list_padded)

        result_images.append(result_image)

    return result_images

def ocrHelperFunc(lines):
    folder_name = "testing"

    sorted_lines = lines

    image_paths = [f"C:/Users/Nandini/Documents/GitHub/HMAC/API/OCR/{folder_name}/words_{line['index']}.jpg" for line in sorted_lines]

    images = [cv2.imread(img_path) for img_path in image_paths]

    result_images = hconcat_resize_batch(images, batch_size=10)

    all_predictions = []

    for j, result_image in enumerate(result_images):
        result_batch = generate_ocr_batch(result_image)
        all_predictions.extend(result_batch)

    predicted_words_string = ' '.join(all_predictions)

    print(f"Predicted Words: {predicted_words_string}")
    deleteImages()
    return predicted_words_string

def generate_ocr_batch(image_batch):
    from transformers import TrOCRProcessor, VisionEncoderDecoderModel
    import requests
    from PIL import Image

    processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-handwritten")
    model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-handwritten")
    pixel_values = processor(image_batch, return_tensors="pt", padding=True).pixel_values
    generated_ids = model.generate(pixel_values)
    generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)

    return generated_text

def deleteImages():
    import shutil

    shutil.rmtree('C:/Users/Nandini/Documents/GitHub/HMAC/API/OCR/testing/')

def makeDir():
    import os 
    directory = "testing"
 
    parent_dir = "C:/Users/Nandini/Documents/GitHub/HMAC/API/OCR/"

    path = os.path.join(parent_dir, directory) 

    os.mkdir(path)
