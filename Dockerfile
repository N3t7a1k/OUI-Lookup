FROM python:3.10
WORKDIR /app

COPY Pipfile Pipfile.lock ./
RUN pip install pipenv && pipenv install --deploy --ignore-pipfile
COPY . .
RUN pipenv run pip install gunicorn
CMD ["pipenv", "run", "gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "--preload", "wsgi:app"]

