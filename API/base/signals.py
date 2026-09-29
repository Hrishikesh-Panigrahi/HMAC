from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.core.files.base import ContentFile

import os
from pdf2image import convert_from_path

from .models import FileModel, FileImage, AIDetection, TxtFileModel, FileComparisonModel, User, FileModel, TxtFileModel, OcrResult
from .helper import roboflowHelperFunc, ocrHelperFunc, makeDir
from .similarity import recompute_assignment

import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
import gensim as gensim

COVER_PAGE_DIRECTORY = 'coverdirectory/'
COVER_PAGE_FORMAT = 'jpg'


@receiver(post_save, sender=FileModel)
def convert_pdf_to_image(sender, instance, created, **kwargs):
    if created:
        # check if COVER_PAGE_DIRECTORY exists, create it if it doesn't
        # have to do this because of setting coverpage attribute of instance programmatically
        cover_page_dir = os.path.join(
            settings.MEDIA_ROOT, COVER_PAGE_DIRECTORY)

        if not os.path.exists(cover_page_dir):
            os.mkdir(cover_page_dir)

        # convert page cover (in this case) to jpg and save
        cover_page_image = convert_from_path(
            pdf_path=instance.file.path,
            dpi=200,
            first_page=1,
            last_page=1,
            fmt=COVER_PAGE_FORMAT,
            output_folder=cover_page_dir,
            poppler_path=r"C:\Users\Nandini\Downloads\Release-23.11.0-0\poppler-23.11.0\Library\bin"
        )[0]

        cover_page_image.close()

        # get name of pdf_file
        pdf_filename, extension = os.path.splitext(
            os.path.basename(instance.file.name))
        new_cover_page_path = '{}.{}'.format(os.path.join(
            cover_page_dir, pdf_filename), COVER_PAGE_FORMAT)
        # rename the file that was saved to be the same as the pdf file
        os.rename(cover_page_image.filename, new_cover_page_path)
        # get the relative path to the cover page to store in model
        new_cover_page_path_relative = '{}.{}'.format(os.path.join(
            COVER_PAGE_DIRECTORY, pdf_filename), COVER_PAGE_FORMAT)
        instance.coverpage = new_cover_page_path_relative

        file_image = FileImage(
            uploaded_by=instance.uploaded_by,
            pdfFile=instance,
            filename=instance.filename,
            description=instance.description,
            file=new_cover_page_path_relative,  # Set the file field to the cover page path
        )

        # Save the new FileImage instance
        file_image.save()

        # call save on the model instance to update database record
        instance.save()


@receiver(post_save, sender=FileImage)
def create_ai_detection(sender, instance, created, **kwargs):
    if created:
        model_path = os.path.join(settings.BASE_DIR, 'new-model')
        tokenizer = DistilBertTokenizer.from_pretrained(
            "distilbert-base-uncased")
        num_labels = 2
        Bert_Model = DistilBertForSequenceClassification.from_pretrained(
            model_path, num_labels=num_labels)
        Bert_Model.eval()

        makeDir()

        lines = roboflowHelperFunc(instance)

        # print("Type of 'detections':", type(lines))

        text = ocrHelperFunc(lines)

        import Levenshtein

        def calculate_cer(reference, hypothesis):
            distance = Levenshtein.distance(reference, hypothesis)
            cer = distance / len(reference)
            return cer * 100

        def calculate_wer(reference, hypothesis):
            reference_words = reference.split()
            hypothesis_words = hypothesis.split()

            distance = Levenshtein.distance(reference_words, hypothesis_words)
            wer = distance / len(reference_words)
            return wer * 100

        def calculate_cra(reference, hypothesis):
            correct_characters = sum(
                r == h for r, h in zip(reference, hypothesis))
            cra = correct_characters / len(reference)
            return cra * 100

        def calculate_wra(reference, hypothesis):
            reference_words = reference.split()
            hypothesis_words = hypothesis.split()

            correct_words = sum(r == h for r, h in zip(
                reference_words, hypothesis_words))
            wra = correct_words / len(reference_words)
            return wra * 100

        # Example usage:
        reference_text = '''One sunny day, Wishers decided to go on an adventure. They all decided to explore the mysterious forest at the edge of the town. With the sun casting warm rays, wishers, the adventurous cat gathered his friends. Under the green canopy of the mysterious forest, Wishers and his friends ventured forth with excitement in their hearts. The air was filled with the sweet scent of blooming flowers, and the rustle of leaves added a rhythm to their journey. As they delved deeper into the woodland, they encountered a babbling brook, its crystal-clear waters inviting them to take a refreshing pause. '''
        hypothesis_text = text

        cer = calculate_cer(reference_text, hypothesis_text)
        wer = calculate_wer(reference_text, hypothesis_text)
        cra = calculate_cra(reference_text, hypothesis_text)
        wra = calculate_wra(reference_text, hypothesis_text)

        # print(f"CRA: {cra:.2f}%")
        # print(f"WRA: {wra:.2f}%")

        # print(f"CER: {cer:.2f}%")
        # print(f"WER: {wer:.2f}%")

        ogtext = GrammarChecker(text)

        # print("OG text:", ogtext)

        newText = ogtext.replace(' ', ',')
        newText = newText.replace('\n', ',')
        newText = newText.replace(',,', ',')

        stop_words = ['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd", 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers', 'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up',
                      'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should', "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't", 'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't", 'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't", 'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"]

        # removes punctuations
        newText = gensim.utils.simple_preprocess(str(newText), deacc=True)

        filtered_sentence = ''

        for w in newText:
            # loop to check stopwords in newtext and get filtered string
            if w not in stop_words:
                filtered_sentence += ' ' + w

        newText = filtered_sentence

        # The model reads at most 512 tokens; longer answers are cut there instead of crashing.
        inputs = tokenizer(ogtext, return_tensors="pt", truncation=True, max_length=512)

        input_ids = inputs["input_ids"]
        attention_mask = inputs["attention_mask"]

        with torch.no_grad():
            outputs = Bert_Model(input_ids, attention_mask)
            logits = outputs.logits

        probabilities = torch.softmax(logits, dim=1)

        percentage_probs = (probabilities * 100).tolist()[0]

        class_labels = [str(i) for i in range(num_labels)]

        class_percentage_dict = {label: percentage for label,
                                 percentage in zip(class_labels, percentage_probs)}

        for label, percentage in class_percentage_dict.items():
            print(f"Class {label}: {percentage:.2f}%")

        detection_results_Human = percentage_probs[0]
        detection_results_AI = percentage_probs[1]

        print(detection_results_Human)

        ai_detection = AIDetection(
            uploaded_by=instance.uploaded_by,
            image=instance,
            filename=instance.filename,
            detection_results_Human=detection_results_Human,
            detection_results_AI=detection_results_AI,
        )
        ai_detection.save()

        ocr_result = OcrResult(
            uploaded_by=instance.uploaded_by,
            submission=instance.pdfFile,
            filename=instance.filename,
            ocr_results=text,
        )
        ocr_result.save()

        # create txt file
        txt_content = newText
        txt_file_name = f"{instance.filename}.txt"
        txt_file = ContentFile(txt_content.encode('utf-8'), name=txt_file_name)

        txt_file_model = TxtFileModel(
            uploaded_by=instance.uploaded_by,
            submission=instance.pdfFile,
            filename=txt_file_name,
            description=instance.description,
            file=txt_file,
        )

        txt_file_model.save()


def GrammarChecker(text):
    import language_tool_python
    tool = language_tool_python.LanguageTool('en-US')
    def is_bad_rule(rule): return rule.message == 'Possible spelling mistake found.' and len(
        rule.replacements) and rule.replacements[0][0].isupper()
    matches = tool.check(text)
    matches = [rule for rule in matches if not is_bad_rule(rule)]
    newtext = language_tool_python.utils.correct(text, matches)

    return newtext


@receiver(post_save, sender=TxtFileModel)
def calculate_similarity_on_upload(sender, instance, created, **kwargs):
    if created:
        # Re-score the whole assignment: which phrases are "common" depends on every submission.
        assignment_id = instance.submission.assignment_id if instance.submission_id else None
        recompute_assignment(assignment_id)
