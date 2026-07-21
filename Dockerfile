# Synapse backend — Gleam/BEAM app
FROM ghcr.io/gleam-lang/gleam:v1.9.1-erlang-alpine

WORKDIR /app
COPY apps/synapse/ .
RUN gleam build

EXPOSE 8000
CMD ["gleam", "run", "--module=synapse"]
