# showme

### Let others watch your terminal session live on the web

### Install:
```sh
  git clone -c http.sslVerify=false https://github.rtp.raleigh.ibm.com/PEMORJAN-de/showme.git
  cd showme
  npm install -g
```

### Alternative Install via Docker Image:
```sh
  git clone -c http.sslVerify=false https://github.rtp.raleigh.ibm.com/PEMORJAN-de/showme.git
  cd showme
  docker build -t showme .
  docker run -ti showme
```

### Usage:
```sh
  Usage: showme [options]

  Let others watch your terminal session on the web

  Options:

    -h, --help           output usage information
    -s, --shell <shell>  shell to use, default: bash

  Examples:
    showme
    showme -s /bin/csh
```
