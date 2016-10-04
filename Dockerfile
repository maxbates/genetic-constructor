# Inherit from ubuntu docker image
FROM ubuntu:14.04

MAINTAINER bionanodevops@autodesk.com # 2016-08-15
ENV CXX g++-4.9
RUN apt-get dist-upgrade -y
RUN apt-get update -y
RUN apt-get upgrade -y

RUN apt-get install -y software-properties-common
RUN add-apt-repository ppa:ubuntu-toolchain-r/test
RUN apt-get update -y

# Explicit set of apt-get commands to workaround issue https://github.com/nodegit/nodegit/issues/886 . Workaround instructions here: http://stackoverflow.com/questions/16605623/where-can-i-get-a-copy-of-the-file-libstdc-so-6-0-15
RUN apt-get install -y curl gcc-4.9 g++-4.9 libstdc++-4.9-dev

RUN apt-get install -y python python-dev python-pip git build-essential wget && \
	curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash - && \
	sudo apt-get -y install nodejs && \
	apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

#everything needed by extensions
RUN yes | pip install biopython

RUN pip install awscli

EXPOSE 3000
ENV PORT=3000

RUN mkdir /app
WORKDIR /app

#setup node
ADD package.json /app/package.json
RUN npm update -g npm && npm install

ADD . /app

#install fsharp (needed by gslEditor extension if it exists)
RUN if [ -d ./extensions/gslEditor/ ]; then ./extensions/gslEditor/tools/install-fsharp.sh ; fi

#install extensions, continue even if errors
RUN npm run install-extensions || true

# add docs, even if package.json hasnt changed
RUN npm run jsdoc

RUN cd /app

# Redis now launch via docker-compose and is referenced via link
CMD  ["npm" , "run", "start-instance"]
