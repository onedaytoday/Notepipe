FROM python:3.10.7
COPY public_html/ /
EXPOSE 7000
CMD python -m http.server 7000