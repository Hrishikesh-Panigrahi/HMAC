from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def calculate_similarity(uploaded_file_content, other_file_content):

    uploaded_text = ' '.join(uploaded_file_content)
    other_text = ' '.join(other_file_content)

    tfidf_matrix = TfidfVectorizer().fit_transform([uploaded_text, other_text])
    similarity = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])
    return similarity[0][0]


def compare_file_similarity(uploaded_file_content, other_file_data):

    try:
        uploaded_text = ' '.join(uploaded_file_content)
        other_text = ' '.join(other_file_data.read_file_content())

        tfidf_matrix = TfidfVectorizer().fit_transform(
            [uploaded_text, other_text])
        similarity = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])
        return other_file_data.filename, similarity[0][0]
    except Exception as exc:
        print(
            f"Error calculating similarity for '{other_file_data.filename}': {exc}")
        return other_file_data.filename, None
