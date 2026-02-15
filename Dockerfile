FROM python:3.13
WORKDIR /app

ENV HOST=0.0.0.0
ENV PORT=5000
ENV WORKERS=4

COPY Pipfile Pipfile.lock ./
RUN pip install pipenv && pipenv install --deploy --ignore-pipfile
COPY . .

EXPOSE ${PORT}

CMD ["pipenv", "run", "gunicorn", "-w", "${WORKERS}", "-b", "${HOST}:${PORT}", "--preload", "wsgi:app"]

