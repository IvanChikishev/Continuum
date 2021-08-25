auth: echo $CR_PAT | docker login ghcr.io -u USERNAME --password-stdin
build: docker build -t ghcr.io/name
push: docker push ghcr.io/name
run: docker run -v /var/run/docker.sock:/var/run/docker.sock ghcr.io/ivanchikishev/continuum