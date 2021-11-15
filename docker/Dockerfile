FROM node:16-alpine3.14

COPY . /app
WORKDIR /app

RUN chmod +x /app/docker/run.sh

ENTRYPOINT ["sh", "/app/docker/run.sh"]
CMD ["run_bot"]