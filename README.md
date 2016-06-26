# showme

### Let others watch your terminal session live on the web

### Install:
```sh
  git clone -c http.sslVerify=false https://github.rtp.raleigh.ibm.com/PEMORJAN-de/showme.git
  cd showme
  npm install -g
```

### Run via public Docker image:
```
   docker run -ti pmorjan/showme
```

### Build private Docker Image:
```sh
  git clone -c http.sslVerify=false https://github.rtp.raleigh.ibm.com/PEMORJAN-de/showme.git
  cd showme
  docker build -t showme .
  docker run -ti showme
```

### Usage:
```sh
  Usage: showme [shell]

    shell: shell to use, default: bash/cmd.exe

  Examples:
    showme
    showme /bin/csh
```
