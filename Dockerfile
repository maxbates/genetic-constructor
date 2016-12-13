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

RUN apt-get install -y python python-dev python-pip git build-essential wget && \
	curl -sL https://deb.nodesource.com/setup_6.x | bash - && \
	apt-get -y install nodejs && \
	apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN pip install awscli

EXPOSE 3000
ENV PORT=3000

RUN mkdir /app
WORKDIR /app

#setup node
ADD package.json /app/package.json
ADD storage-ext /app/storage-ext
RUN npm update -g npm && npm install

ADD . /app

#install extensions, continue even if errors
RUN npm run install-extensions || true

# add docs, even if package.json hasnt changed
RUN npm run jsdoc

RUN cd /app

# Redis now launch via docker-compose and is referenced via link
CMD  ["npm" , "run", "start-instance"]
